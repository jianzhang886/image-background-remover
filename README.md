# Image Background Remover - MVP 需求文档

一个基于 Remove.bg API 的在线图片背景移除工具，部署在 Cloudflare Pages。

## 项目概述

- **项目名称：** Image Background Remover
- **目标：** 提供简洁易用的在线图片背景移除服务
- **技术栈：** React + TypeScript + Vite + Tailwind CSS
- **部署：** Cloudflare Pages（静态托管）
- **API：** Remove.bg API

## 核心功能需求

### 1. 图片上传
- [x] 支持点击选择文件上传
- [x] 支持拖拽上传图片
- [x] 支持常见图片格式：JPG、PNG、WEBP
- [x] 文件大小限制：最大 30MB（符合 Remove.bg 免费额度限制）

### 2. API Key 配置
- [x] 提供用户输入框让用户输入自己的 Remove.bg API Key
- [x] API Key 保存在浏览器本地存储（LocalStorage），无需后端存储
- [x] 用户可以随时修改或清除 API Key
- [x] 提供跳转到 Remove.bg 获取 API Key 的链接

### 3. 背景移除处理
- [x] 上传图片后调用 Remove.bg API 进行背景移除
- [x] 显示处理进度加载状态
- [x] 错误处理：API 调用失败时显示清晰的错误信息
- [x] 所有图片处理仅在前端完成，不存储到任何服务器

### 4. 结果展示
- [x] 原图和处理后图片并排对比展示
- [x] 支持放大查看处理效果
- [x] 显示原始图片信息（尺寸、文件大小）

### 5. 结果下载
- [x] 一键下载处理后的 PNG 图片（透明背景）
- [x] 自动命名下载文件：`original_name_removed.png`

### 6. 页面设计
- [x] 简洁现代的 UI 设计
- [x] 全响应式，支持移动端和桌面端
- [x] 深色/浅色模式支持（可选）
- [x] 隐私说明：明确告知用户图片不会被存储

## 非功能需求

### 性能
- [x] 首屏加载速度 < 2s
- [x] 静态资源压缩优化
- [x] 不加载不必要的依赖

### 隐私
- [x] API Key 仅保存在用户本地浏览器
- [x] 图片仅上传到 Remove.bg API，不在本网站存储
- [x] 无追踪、无统计、无广告

### 可维护性
- [x] 清晰的项目结构
- [x] 必要的代码注释
- [x] 部署文档完善

## 用户流程

```
用户进入网站
  ↓
输入 API Key（第一次使用，已保存则自动填充）
  ↓
拖拽或点击上传图片
  ↓
点击"开始移除背景"
  ↓
等待 API 处理（显示加载动画）
  ↓
查看原图 vs 处理后对比
  ↓
满意 → 下载 PNG 图片
不满意 → 重新上传新图片
```

## API 调用说明

Remove.bg API 文档：https://www.remove.bg/api

- **Endpoint:** `https://api.remove.bg/v1.0/removebg`
- **Authentication:** `X-Api-Key: {API_KEY}`
- **Request:** multipart/form-data 包含 image 文件
- **Response:** 返回处理后的图片二进制数据
- **免费额度：** 每月 50 次免费处理

## 环境变量

开发环境可配置 `.env` 文件：
```
VITE_REMOVE_BG_API_KEY=（可选，默认留空让用户输入）
```

## 部署配置

Cloudflare Pages 构建配置：
- **构建命令：** `npm run build`
- **输出目录：** `dist`
- **环境变量：** 无需配置（用户在前端输入 API Key）

## MVP 功能优先级

1. **P0 - 必须完成：** 上传 + API 调用 + 展示 + 下载
2. **P1 - 应该完成：** 拖拽上传 + 本地存储 API Key + 对比展示 + 响应式
3. **P2 - 可以有：** 深色模式 + 图片缩放预览

## 上线后后续优化（可选）

- 添加批量处理功能
- 支持直接粘贴图片从剪贴板
- 添加简单的图片裁剪功能
- 支持不同输出格式（JPG/PNG）
