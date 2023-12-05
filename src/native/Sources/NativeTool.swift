import AppKit
import ArgumentParser
import Foundation
import Vision

enum Command: ExpressibleByArgument {
  init?(argument: String) {
    switch argument {
    case "ocr":
      self = .ocr
    default:
      self = .unknown
    }
  }

  case ocr
  case unknown
}

@main
struct NativeTool: AsyncParsableCommand {
  @Argument(help: "Which command to run")
  public var command: Command

  @Option(help: "Path to the image to OCR")
  public var file: String

  public func run() async throws {
    switch command {
    case .ocr:
      let url = URL(fileURLWithPath: file)
      let image = try VNImageRequestHandler(url: url, options: [:])
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      try await image.perform([request])
      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        print("No results")
        return
      }
      let text = observations.compactMap { observation in
        observation.topCandidates(1).first?.string
      }.joined(separator: "\n")
      print(text)
    case .unknown:
      print("Unknown command")
    }
  }
}
