import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  iosSimulatorNativeDevelopmentSidecarPath,
  iosSimulatorPackagedHelperExecutablePath,
} from "./layout.js";

describe("native sidecar artifact layout", () => {
  it("resolves the development binary by architecture", () => {
    expect(
      iosSimulatorNativeDevelopmentSidecarPath(
        "/workspace/apps/desktop/resources",
        "arm64",
      ),
    ).toBe(
      path.join(
        "/workspace/apps/desktop/resources",
        "ios-simulator",
        "native",
        "arm64",
        "ios-simulator-sidecar",
      ),
    );
  });

  it("resolves the packaged executable from the nested Host helper", () => {
    expect(
      iosSimulatorPackagedHelperExecutablePath(
        "/Applications/Zbot.app/Contents/Resources",
      ),
    ).toBe(
      path.join(
        "/Applications/Zbot.app/Contents/Helpers",
        "Zbot iOS Simulator Helper.app",
        "Contents",
        "MacOS",
        "ios-simulator-sidecar",
      ),
    );
  });
});
