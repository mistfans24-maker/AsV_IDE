import Cocoa
import WebKit
import Security

final class VaultBridge: NSObject, WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "asvVault", let payload = message.body as? [String: String], let provider = payload["provider"], let key = payload["key"], !key.isEmpty else { return }
    let service = "AsV_IDE.AI.Vault"; let account = provider.lowercased(); let data = key.data(using: .utf8)!
    SecItemDelete([kSecClass: kSecClassGenericPassword, kSecAttrService: service, kSecAttrAccount: account] as CFDictionary)
    SecItemAdd([kSecClass: kSecClassGenericPassword, kSecAttrService: service, kSecAttrAccount: account, kSecValueData: data] as CFDictionary, nil)
  }
}

final class ExecutorBridge: NSObject, WKScriptMessageHandler {
  weak var webView: WKWebView?
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "asvExecute", let payload = message.body as? [String: String], let language = payload["language"], let code = payload["code"] else { return }
    let commands = ["Python": ("python3", "py"), "Ruby": ("ruby", "rb"), "Lua": ("lua", "lua"), "JavaScript": ("node", "js")]
    guard let command = commands[language] else { publish("This language is not a local script runtime."); return }
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      let file = FileManager.default.temporaryDirectory.appendingPathComponent("asv-run-\(UUID().uuidString).\(command.1)")
      defer { try? FileManager.default.removeItem(at: file) }
      do {
        try code.write(to: file, atomically: true, encoding: .utf8)
        let process = Process(); let pipe = Pipe()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env"); process.arguments = [command.0, file.path]
        process.standardOutput = pipe; process.standardError = pipe
        try process.run()
        DispatchQueue.global().asyncAfter(deadline: .now() + 8) { if process.isRunning { process.terminate() } }
        process.waitUntilExit()
        let output = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        self?.publish(output.isEmpty ? "Finished successfully." : output)
      } catch { self?.publish("Could not run \(language): \(error.localizedDescription)") }
    }
  }
  private func publish(_ output: String) {
    let safe = String(output.prefix(20000))
    let json = (try? JSONEncoder().encode(safe)).flatMap { String(data: $0, encoding: .utf8) } ?? "\"Output unavailable\""
    DispatchQueue.main.async { self.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('asv-execute-output',{detail:\(json)}));") }
  }
}

final class ServerBridge: NSObject, WKScriptMessageHandler {
  weak var webView: WKWebView?
  private var servers: [Process] = []
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "asvServer", let payload = message.body as? [String: String], let language = payload["language"], let code = payload["code"], let port = payload["port"], let command = ["Python": ("python3", "py"), "JavaScript": ("node", "js")][language] else { publish("Only Python and JavaScript localhost cells are supported."); return }
    let file = FileManager.default.temporaryDirectory.appendingPathComponent("asv-server-\(UUID().uuidString).\(command.1)")
    do {
      try code.write(to: file, atomically: true, encoding: .utf8)
      let process = Process(); let pipe = Pipe(); process.executableURL = URL(fileURLWithPath: "/usr/bin/env"); process.arguments = [command.0, file.path]; process.standardOutput = pipe; process.standardError = pipe
      try process.run(); servers.append(process)
      DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self, weak process] in
        guard let self else { return }
        if process?.isRunning == true { self.publish("http://localhost:\(port)") } else { self.publish(String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? "Server could not start.") }
      }
    } catch { publish("Could not start server: \(error.localizedDescription)") }
  }
  func stopAll() { servers.forEach { if $0.isRunning { $0.terminate() } }; servers.removeAll() }
  private func publish(_ output: String) { let json = (try? JSONEncoder().encode(output)).flatMap { String(data: $0, encoding: .utf8) } ?? "\"Output unavailable\""; webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('asv-server-output',{detail:\(json)}));") }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
  private var server: Process?
  private var mainWindow: NSWindow?
  private let bridge = VaultBridge()
  private let executor = ExecutorBridge()
  private let localServer = ServerBridge()
  func applicationDidFinishLaunching(_ notification: Notification) {
    let task = Process(); task.executableURL = URL(fileURLWithPath: "/usr/bin/env"); task.arguments = ["npm", "run", "dev"]; task.currentDirectoryURL = URL(fileURLWithPath: "__PROJECT_ROOT__"); task.standardOutput = FileHandle.nullDevice; task.standardError = FileHandle.nullDevice; try? task.run(); server = task
    let content = WKUserContentController(); content.add(bridge, name: "asvVault"); content.add(executor, name: "asvExecute"); content.add(localServer, name: "asvServer")
    content.addUserScript(WKUserScript(source: "window.asvVault={save:(provider,key)=>window.webkit.messageHandlers.asvVault.postMessage({provider:provider,key:key})};window.asvExecutor={run:(language,code)=>window.webkit.messageHandlers.asvExecute.postMessage({language:language,code:code})};window.asvServer={start:(language,code,port)=>window.webkit.messageHandlers.asvServer.postMessage({language:language,code:code,port:port})};", injectionTime: .atDocumentStart, forMainFrameOnly: true))
    let config = WKWebViewConfiguration(); config.userContentController = content
    let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 1280, height: 800), configuration: config)
    executor.webView = view
    localServer.webView = view
    let window = NSWindow(contentRect: view.frame, styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    window.title = "AsV_IDE"; window.center(); window.contentView = view; window.makeKeyAndOrderFront(nil)
    mainWindow = window
    NSApp.activate(ignoringOtherApps: true)
    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { view.load(URLRequest(url: URL(string: "http://localhost:3000/")!)) }
  }
  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
  func applicationWillTerminate(_ notification: Notification) { server?.terminate(); localServer.stopAll() }
}
let app = NSApplication.shared; let delegate = AppDelegate(); app.delegate = delegate; app.setActivationPolicy(.regular); app.run()
