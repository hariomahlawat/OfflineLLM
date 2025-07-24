# Vendoring dependencies

This repository can be used completely offline once all Python wheels and npm packages are cached locally.

Run `./codex/vendor.sh` on a machine with internet access. It will download the Python wheels listed in `requirements.lock` and create tarballs of the Node dependencies. The files are stored under the `vendor/` directory so they can be committed to the repository or copied to an offline machine.

The normal setup script `./codex/setup.sh` automatically installs from these vendored files when they are present.
