{ lib, rustPlatform, fetchFromGitHub }:

rustPlatform.buildRustPackage rec {
  pname = "rtk";
  version = "0.47.0";

  src = fetchFromGitHub {
    owner = "rtk-ai";
    repo = "rtk";
    rev = "v${version}";
    hash = "sha256-qYVkFLS6G4Tf1NmD9B3kJkyb47XREoVE65EqBtbzzjs=";
  };

  cargoHash = "sha256-2lwLPia3v7xagKsrCpayixZMmOqX15qrjsVP8/RQCXE=";

  doCheck = false;

  meta = {
    description = "CLI proxy that reduces LLM token consumption by 60-90% on common dev commands";
    homepage = "https://github.com/rtk-ai/rtk";
    license = lib.licenses.mit;
    mainProgram = "rtk";
    platforms = lib.platforms.unix;
  };
}
