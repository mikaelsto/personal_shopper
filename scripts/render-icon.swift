// Renders web/icon.svg to the PNG home-screen icons (macOS only): swift scripts/render-icon.swift web/icon.svg web 180 192 512
import AppKit
let args = CommandLine.arguments
guard let svg = NSImage(contentsOf: URL(fileURLWithPath: args[1])) else { fatalError("cannot read \(args[1])") }
for size in args[3...].compactMap({ Int($0) }) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: size, height: size)
    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    ctx.imageInterpolation = .high
    NSGraphicsContext.current = ctx
    svg.draw(in: NSRect(x: 0, y: 0, width: size, height: size))
    NSGraphicsContext.restoreGraphicsState()
    let out = URL(fileURLWithPath: args[2]).appendingPathComponent("icon-\(size).png")
    try! rep.representation(using: .png, properties: [:])!.write(to: out)
    print(out.path)
}
