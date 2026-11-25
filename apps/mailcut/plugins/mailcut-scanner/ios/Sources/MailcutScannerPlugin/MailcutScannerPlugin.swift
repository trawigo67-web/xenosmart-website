import Foundation
import UIKit
import VisionKit
import Capacitor

/// Oeffnet den eingebauten Dokumenten-Scanner des iPhones (Kanten erkennen, gerade ziehen,
/// mehrere Seiten) und gibt die Seiten als JPEG (data-URL) an die Web-App zurueck.
@objc(MailcutScannerPlugin)
public class MailcutScannerPlugin: CAPPlugin, CAPBridgedPlugin, VNDocumentCameraViewControllerDelegate {
    public let identifier = "MailcutScannerPlugin"
    public let jsName = "MailcutScanner"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?
    private var quality: CGFloat = 0.8
    private var maxSide: CGFloat = 2200

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": VNDocumentCameraViewController.isSupported])
    }

    @objc func scan(_ call: CAPPluginCall) {
        guard VNDocumentCameraViewController.isSupported else {
            call.reject("Der Dokumenten-Scanner ist auf diesem Geraet nicht verfuegbar.", "UNAVAILABLE")
            return
        }
        if pendingCall != nil {
            call.reject("Der Scanner ist schon offen.", "BUSY")
            return
        }
        quality = CGFloat(min(max(call.getDouble("quality") ?? 0.8, 0.3), 1.0))
        maxSide = CGFloat(min(max(call.getDouble("maxSide") ?? 2200, 800), 4000))
        pendingCall = call
        DispatchQueue.main.async {
            let scanner = VNDocumentCameraViewController()
            scanner.delegate = self
            scanner.modalPresentationStyle = .fullScreen
            guard let vc = self.bridge?.viewController else {
                self.finish(reject: "Keine Ansicht zum Anzeigen gefunden.")
                return
            }
            vc.present(scanner, animated: true)
        }
    }

    public func documentCameraViewController(_ controller: VNDocumentCameraViewController,
                                             didFinishWith scan: VNDocumentCameraScan) {
        var pages: [String] = []
        for i in 0..<scan.pageCount {
            let image = resized(scan.imageOfPage(at: i))
            if let data = image.jpegData(compressionQuality: quality) {
                pages.append("data:image/jpeg;base64," + data.base64EncodedString())
            }
        }
        controller.dismiss(animated: true) { self.finish(resolve: ["pages": pages, "cancelled": false]) }
    }

    public func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
        controller.dismiss(animated: true) { self.finish(resolve: ["pages": [], "cancelled": true]) }
    }

    public func documentCameraViewController(_ controller: VNDocumentCameraViewController,
                                             didFailWithError error: Error) {
        controller.dismiss(animated: true) { self.finish(reject: error.localizedDescription) }
    }

    private func finish(resolve data: [String: Any]? = nil, reject message: String? = nil) {
        guard let call = pendingCall else { return }
        pendingCall = nil
        if let message = message { call.reject(message, "FAILED") } else { call.resolve(data ?? [:]) }
    }

    private func resized(_ image: UIImage) -> UIImage {
        let w = image.size.width, h = image.size.height
        let longest = max(w, h)
        guard longest > maxSide else { return image }
        let scale = maxSide / longest
        let size = CGSize(width: floor(w * scale), height: floor(h * scale))
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
