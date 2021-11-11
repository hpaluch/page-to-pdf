# Custom export of Page to PDF

Here are my random scripts to export choosen pages to PDF

## Common setup

Tested on openSUSE LEAP 15.3. Install:

```bash
sudo zypper in npm chromium make gcc gcc-c++ nodejs-devel git-core
```

Checkout and prepare this project:

```bash
mkdir -p ~/projects
cd ~/projects
git clone xxxxxxx
cd page-to-pdf
npm -i
```

## Ubuntu Mojo Update (blog)

To run export

- from https://ubuntu.com/blog/mojo-updates
- to blog-mojo-update.pdf

Invoke:

```bash
npm run mojo-update
```

Ubuntu Mojo 3 part tutorial:

```bash
npm run mojo-juju-1of3
npm run mojo-juju-2of3
npm run mojo-juju-3of3
```
Bug: Most images are missing



