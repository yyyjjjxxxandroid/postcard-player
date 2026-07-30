# 寄给未来｜明信片播放器

一个移动端优先的音乐播放器：在歌词播放到某个瞬间写下一张纸条，
下次再次听到同一时间点时，过去的心情会自动浮现。

## 功能

- HTML Audio 真实播放、暂停、进度拖动和歌词高亮
- 在当前歌词时间点创建纸条
- 使用 `localStorage` 保存喜欢状态和纸条历史
- 播放至纸条时间点 ±0.8 秒时自动展示，4 秒后淡出
- 从历史纸条跳转回对应时间点
- 分享包含 `song`、`t` 和 `note` 参数的时间点链接
- 手机竖屏优先的纸张、邮戳、折角便签和动效设计

## 本地开发

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

打开 <http://localhost:3000/>。

## 检查与构建

```bash
npm run lint
npm test
npm run build
```

## 主要目录

- `app/page.tsx`：播放器组件与交互逻辑
- `app/globals.css`：移动端布局、纸张质感与动效
- `public/postcard-daisies.jpg`：明信片照片
- `public/og.png`：分享预览图

音频目前使用公开的远程演示 MP3。接入正式歌曲时，将音频放入
`public/music/`，并修改 `app/page.tsx` 中的 `SONG.audio` 即可。

## 协作约定

建议从 `main` 拉出功能分支，使用简短、聚焦的提交，并在合并前运行
`npm run lint && npm test`。
