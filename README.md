# 🎂 [thesedays](http://thesedays.cn)--Birthday Page

> **有些话说不出口，就让代码替你表达 💫**
>
> **每一岁，都值得一份仪式感 ✨**

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-12-FF0055?logo=framer&logoColor=white" alt="Framer Motion" />
  <br />
  <img src="https://img.shields.io/badge/License-CC%20BY--NC%204.0-ef9700.svg" alt="License" />
  <img src="https://img.shields.io/badge/Usage-Free_for_personal_use-blue.svg" alt="Usage" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" />
  <img src="https://img.shields.io/github/issues/addicted-yt/birthday-page" alt="Issues" />
  <img src="https://img.shields.io/github/stars/addicted-yt/birthday-page?style=social" alt="Stars" />
</p>


<p align="center">
  一份沉浸式生日体验 —— 可定制 · 可分享 · 感动每一刻
</p>
用几分钟为 TA 制作一份专属生日祝福：上传照片、写下心里话，生成一段浪漫的星空动画贺卡，通过链接分享给重要的人。

<p align="center">
  <a href="https://thesedays.cn/">🌐 免费在线使用</a> · <a href="https://happy-birthday.65751062.workers.dev/">☁️ 备用链接</a>
  <br />
  <span style="font-size:12px;color:#888;">⚠️ 国内访问备用链接可能需要科学上网 · 推荐使用电脑端体验，移动端不断优化中</span>
</p>


---

## ✨ 功能特性

- **📸 照片卡片** — 上传照片，添加个性化文字标注，自定义位置、颜色、大小
- **✂️ 图片裁剪** — 内置裁剪工具，自由调整照片构图
- **📦 批量上传** — 支持多张照片同时上传，省时省力
- **🧠 智能压缩** — 自动压缩图片（最长边 ≤900px，JPEG 质量 0.82），保证清晰度的同时提升加载速度
- **✍️ 文字标注** — 贺卡文字可自定义位置、对齐方式（左/中/右）、字号和颜色
- **🎵 背景音乐** — 生日快乐歌 + 钢琴曲自动切换，营造沉浸式氛围
- **🔊 音频自动播放适配** — 针对移动端浏览器自动播放限制（iOS、微信 WebView 等），首次交互后解锁音频播放
- **🕯️ 吹蜡烛互动** — 滚动触发蜡烛动画，点击/触摸吹灭蜡烛解锁下一幕
- **🎁 礼物开启动画** — 点击打开礼物，展示信和珍藏照片
- **🌌 星空背景** — 粒子动画 + 宇宙主题，视觉沉浸感拉满
- **🎞️ 页面过渡** — 场景之间流畅的转场动画，沉浸式体验
- **🔗 一键分享** — 生成链接发给 TA，无需登录即可查看
- **☁️ 云存储** — 云端保存图片（云端15天自动删除），分享链接永久有效；本地使用 IndexedDB 缓存加速加载
- **🛠️ 创作者工具栏** — 预览页面浮动工具栏，支持继续编辑和快速分享
- **🎬 演示页面** — 内置完整 Demo，无需制作即可预览全部效果
- **📱 响应式设计** — 手机、平板、电脑完美适配
- **🎞️ 逐张裁剪流程** — 批量选择照片后，会逐张进入裁剪，不会只处理第一张
- **🔢 数量自动截断** — 卡片照片最多 5 张，礼物照片最多 3 张，超出数量会自动截断
- **💌 自动上推的信** — 信件字幕会像歌词一样自动上推，情绪节奏更完整
- **📱 移动端麦克风提示** — 触摸设备在调用麦克风前会先提示音量变化，也可以改为轻触蜡烛熄灭
- **🖼️ 社交分享封面** — 结果页支持 Open Graph / Twitter 分享图预览，更适合在微信和社交平台传播

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 全栈框架 |
| [React 19](https://react.dev/) | UI 组件库 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS 4](https://tailwindcss.com/) | 样式方案 |
| [Framer Motion](https://www.framer.com/motion/) | 动画引擎 |
| [lz-string](https://github.com/pieroxy/lz-string) | URL 数据压缩 |
| [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop) | 图片裁剪 |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | 图片云存储 |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | 本地图片缓存 |

---

## 🚀 本地运行(仅自己可见)

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/addicted-yt/birthday-page.git

# 进入目录
cd birthday-page

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

> 💡 **提示**：本地运行仅本机可预览，生成的分享链接只有你自己能打开。
>
> 想让 TA 收到祝福？直接用上方的 [在线体验链接](#-) 制作，生成的链接任何人都能打开 ✉️

---

## 🎬 制作流程

```
Step 1: 输入 TA 的名字
    ↓
Step 2: 上传照片（支持批量上传，可选裁剪，自动压缩）
    ↓
Step 3: 为照片添加文字标注（自定义位置、对齐、字号、颜色）
    ↓
Step 4: 写一封信
    ↓
Step 5: 添加珍藏照片（可选）
    ↓
Step 6: 预览 → 生成分享链接
```

## 🎥 展示场景说明

```
Scene 1: 开场 → 星空粒子入场
Scene 2: 标题 → "送给 [名字] 的一份特别祝福"
Scene 3: 照片卡片 → 逐张滑入展示
Scene 4.5: 蜡烛 → 吹灭蜡烛，生日歌响起
Scene 4: 礼物 → 点击打开礼物盒
Scene 5: 手写信 + 珍藏照片
Scene 6: 升华 → 感恩与祝福
Scene 7: 结尾 → "生日快乐"
```

---

## 📄 License

本项目基于 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 协议开源

## ⚖️ 免责声明(使用则默认同意)

- 本项目为**开源免费项目**，**个人使用无限制**
- 依据 CC BY-NC 4.0 协议，**严禁将本项目用于任何商业用途**
- 通过本项目在线链接制作、上传、分享的所有图片和文字内容，用户需自行确保**符合当地法律法规**
- 因用户上传或分享的内容所引发的任何法律责任，**由用户本人承担，与本项目作者无关**

---

> 用代码传递温暖，每个生日都值得被记住 🎉
