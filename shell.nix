{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    python3Packages.pip
    python3Packages.requests
    python3Packages.pygithub
    python3Packages.fastapi
    python3Packages.uvicorn
    python3Packages.sqlalchemy
    python3Packages.pydantic
    python3Packages.python-dotenv
  ];
}
