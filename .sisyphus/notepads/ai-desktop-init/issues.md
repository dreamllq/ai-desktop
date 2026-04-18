# Issues

## 2026-04-18 Electron Binary Installation Failure

**Problem**: `npm run dev` 报错 `Error: Electron failed to install correctly, please delete node_modules/electron and try installing again`。`node_modules/electron/dist/` 目录不存在，说明 Electron 二进制文件未正确下载。

**Root Cause**: Electron 的 postinstall 脚本需要从 GitHub Releases 下载平台对应的二进制文件（~100MB），在国内网络环境下经常下载失败，导致 `node_modules/electron/dist/` 目录为空或不存在。

**Fix**:

```bash
# 1. 设置国内镜像（写入 shell 配置可永久生效）
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# 2. 删除损坏的 electron 模块
rm -rf node_modules/electron

# 3. 重新安装（会使用镜像下载二进制）
npm install electron@39.2.6 --save-dev
```

**Verification**: `node -e "console.log(require('electron'))"` 应输出 Electron 二进制路径（如 `.../Electron.app/Contents/MacOS/Electron`），不再抛错。

**Tip**: 如果希望永久生效，在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
```

或者在项目根目录创建 `.npmrc`：

```
electron_mirror=https://npmmirror.com/mirrors/electron/
```
