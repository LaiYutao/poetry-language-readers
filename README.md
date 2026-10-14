# Poetry Language Readers · 诗歌与语言阅读

Letter Lai 的多语言诗歌逐词读本与语法阅读手册资料库。

逐词读本按诗展开，语法手册按问题查阅；二者分别编纂。同语言的新作者读本默认复用已有语法手册。

[在线阅读三册语音读本](https://laiyutao.github.io/poetry-language-readers/) · [版权与使用说明](COPYRIGHT.md)

## 当前读本

以下链接指向当前成稿，更新于 2026-10-14。里尔克与特拉克尔仍为试编版，正在逐首审订。

| 读本 | 版本 | PDF | Markdown | 网页语音版 |
|---|---|---|---|---|
| 策兰《呼吸结晶》21首 | v2.0 | [50 页](publications/de/celan-atemkristall/策兰《呼吸结晶》21首逐词译注读本_v2.0.pdf) | [正文](publications/de/celan-atemkristall/策兰《呼吸结晶》21首逐词译注读本_v2.0.md) | [在线阅读](https://laiyutao.github.io/poetry-language-readers/publications/de/celan-atemkristall/策兰《呼吸结晶》21首逐词译注读本_v2.0_网页语音版.html) |
| 里尔克诗选20首 | v0.2 | [45 页](publications/de/rilke-selected/里尔克诗选20首逐词译注读本_v0.2.pdf) | [正文](publications/de/rilke-selected/里尔克诗选20首逐词译注读本_v0.2.md) | [在线阅读](https://laiyutao.github.io/poetry-language-readers/publications/de/rilke-selected/里尔克诗选20首逐词译注读本_v0.2_网页语音版.html) |
| 特拉克尔诗选23首 | v0.2 | [50 页](publications/de/trakl-gedichte-1913/特拉克尔诗选23首逐词译注读本_v0.2.pdf) | [正文](publications/de/trakl-gedichte-1913/特拉克尔诗选23首逐词译注读本_v0.2.md) | [在线阅读](https://laiyutao.github.io/poetry-language-readers/publications/de/trakl-gedichte-1913/特拉克尔诗选23首逐词译注读本_v0.2_网页语音版.html) |

PDF 保留原文、逐词引线、语法辅助色、白话译文、句法说明与分页；Markdown 适合搜索和编辑。确定的名词复数在逐词注释中以辅助色“·复”提示；单数不标，白话译文不机械添加复数表达。白话译文与逐词注释各有侧重，具体译法仍可继续校订。

## 网页语音版怎么用

可直接打开[在线读本目录](https://laiyutao.github.io/poetry-language-readers/)，选择诗人后在网页中阅读、播放。离线阅读使用上表的普通 PDF，不再提供单文件离线 HTML 或语音 PDF。

点击每首首页的“播放”开始收听，再点可暂停；“停止”回到开头。顶部进度条可点击、拖动跳转，滚动页面不会打断播放。书页按需加载，音频在点击播放时加载。“来源”打开原录音页面；朗读者在诗歌首页与书末收听索引中署名。

网页文字可直接选择复制。中文正文和词注使用 300 细体；“播放、停止、来源”按钮保留 400，德语与标题字重沿用原样。

Markdown 与 PDF 从同一份审核后的主稿生成，网页正文从该 PDF 转换。每册 `alignment.json` 记录主稿和输出文件的校验值，发布前检查内容一致性。详见[三格式同步与网页发布说明](docs/三格式同步与网页发布说明.md)。

| 读本 | 已收录录音 | 说明 |
|---|---|---|
| 呼吸结晶 | 21/21 首 | 8 首为策兰本人录音；第 6、11 首已采用 Matthias Kadar。Kadar 选段来自其朗读与演唱节目。 |
| 里尔克 | 20/20 首 | 采用 Peter Lieck、Jürgen Goslar、Otto Sander、Matthias Habich、Oskar Werner 等版本；不再使用 Fritz Stavenhagen 的录音。第 7、15 首目前按来源频道署名。 |
| 特拉克尔 | 23/23 首 | 已含第 22 首《Klage》（首句 Schlaf und Tod）；Lyrik 频道未注明朗读者实名，故明确标作未署名。《Untergang》以 Reflektor 的频道署名标注。 |

三册延续低饱和配色：策兰青绿、里尔克棕橙、特拉克尔深蓝。 左上角的 **Lyrik** 字标可返回主页；[字标设计参数与复用说明](docs/Lyrik字标设计说明.md)已记录。网页可阅读、收听与选择复制文字；离线阅读、打印和批注使用 PDF。

## 配套语法手册

[《策兰〈呼吸结晶〉德语语法阅读手册》v2.1 · PDF](publications/de/celan-atemkristall/策兰《呼吸结晶》德语语法阅读手册_v2.1.pdf) · [Markdown](publications/de/celan-atemkristall/策兰《呼吸结晶》德语语法阅读手册_v2.1.md)

里尔克、特拉克尔及后续德语读本复用这份手册；作品自身的句法和词义问题在各读本解释。

## 编纂方法与模板

- [逐词读本编纂指南](docs/逐词读本编纂指南.md)：阅读层次、词注与白话的分工、颜色、引线、行距、校勘与定稿流程。
- [语法手册编纂指南](docs/语法手册编纂指南.md)：规则、普通例句、诗例和索引的独立组织方法。
- [逐词读本项目模板](templates/逐词读本项目模板.md)
- [语法手册项目模板](templates/语法手册项目模板.md)
- [来源与收录说明](SOURCES.md)

## 项目组织

当前成稿放在 `publications/de/<作者-作品>/`，方法与模板分别放在 `docs/` 和 `templates/`。`manifest.json` 记录文件校验值；三册的 `content.json` 与本次文字成稿同步。仓库不含全部排版程序、字体与底本材料，不提供一键重建 PDF 的命令。

后续方向包括布莱希特、策兰其他诗集，以及英语、法语和西班牙语读本；同语言新读本不默认重编语法手册。当前入口仅列最新版成稿，不把校对清单混入阅读文件。

仓库和网站现已公开。原创内容供个人非商业学习使用，未经书面许可不得商用、转载、重新发布或另行分发；第三方内容权利另属。完整范围、法定例外与 GitHub 平台条款见[版权与使用说明](COPYRIGHT.md)。
