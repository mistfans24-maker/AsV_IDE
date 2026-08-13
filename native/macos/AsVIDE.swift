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

final class AppDelegate: NSObject, NSApplicationDelegate {
  private var server: Process?; private let bridge = VaultBridge()
  func applicationDidFinishLaunching(_ notification: Notification) {
    let task = Process(); task.executableURL = URL(fileURLWithPath: "/usr/bin/env"); task.arguments = ["npm", "run", "dev"]; task.currentDirectoryURL = URL(fileURLWithPath: "__PROJECT_ROOT__"); task.standardOutput = FileHandle.nullDevice; task.standardError = FileHandle.nullDevice; try? task.run(); server = task
    let content = WKUserContentController(); content.add(bridge, name: "asvVault")
    content.addUserScript(WKUserScript(source: "window.asvVault={save:(provider,key)=>window.webkit.messageHandlers.asvVault.postMessage({provider:provider,key:key})};", injectionTime: .atDocumentStart, forMainFrameOnly: true))
    let config = WKWebViewConfiguration(); config.userContentController = content
    let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 1280, height: 800), configuration: config)
    let window = NSWindow(contentRect: view.frame, styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    window.title = "AsV_IDE"; window.center(); window.contentView = view; window.makeKeyAndOrderFront(nil)
    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { view.load(URLRequest(url: URL(string: "http://localhost:3000/")!)) }
  }
  func applicationWillTerminate(_ notification: Notification) { server?.terminate() }
}
let app = NSApplication.shared; let delegate = AppDelegate(); app.delegate = delegate; app.setActivationPolicy(.regular); app.run()
