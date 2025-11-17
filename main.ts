import { App, Plugin, PluginSettingTab, Setting, Notice, MarkdownView, TFile, Platform, MarkdownRenderer, Component, Modal } from 'obsidian';

interface PDFExportSettings {
	fontSize: number;
	lineHeight: number;
	includeTitle: boolean;
}

const DEFAULT_SETTINGS: PDFExportSettings = {
	fontSize: 14,
	lineHeight: 1.6,
	includeTitle: true
}

// PDF预览模态框
class PDFPreviewModal extends Modal {
	private content: string;
	private title: string;
	private settings: PDFExportSettings;

	constructor(app: App, content: string, title: string, settings: PDFExportSettings) {
		super(app);
		this.content = content;
		this.title = title;
		this.settings = settings;
	}

	onOpen() {
		const { contentEl, modalEl } = this;

		// 设置模态框为全屏
		modalEl.addClass('pdf-export-modal');
		modalEl.style.width = '95vw';
		modalEl.style.height = '95vh';
		modalEl.style.maxWidth = '95vw';
		modalEl.style.maxHeight = '95vh';

		// 创建工具栏
		const toolbar = contentEl.createDiv({ cls: 'pdf-export-toolbar' });
		toolbar.style.cssText = `
			padding: 10px;
			background: #f0f0f0;
			border-bottom: 1px solid #ddd;
			display: flex;
			justify-content: space-between;
			align-items: center;
		`;

		// 左侧说明
		const instructions = toolbar.createDiv();
		instructions.innerHTML = Platform.isMobile
			? `<strong>iOS 导出步骤：</strong><br>
			   1. 点击下方"复制HTML"按钮<br>
			   2. 在Safari中打开新标签页<br>
			   3. 粘贴到地址栏并访问<br>
			   4. 使用分享→打印→保存PDF`
			: `<strong>桌面端：</strong> 点击"打印"按钮或按 Ctrl/Cmd+P`;

		// 右侧按钮
		const buttons = toolbar.createDiv();
		buttons.style.cssText = 'display: flex; gap: 10px;';

		// 复制HTML按钮（移动端主要使用）
		const copyBtn = buttons.createEl('button', { text: '复制HTML' });
		copyBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px;';
		copyBtn.onclick = () => {
			const htmlContent = this.buildFullHTML();
			const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
			navigator.clipboard.writeText(dataUrl).then(() => {
				new Notice('HTML数据URL已复制！在Safari中粘贴到地址栏访问');
			}).catch(() => {
				// 备选：复制纯HTML
				navigator.clipboard.writeText(htmlContent).then(() => {
					new Notice('HTML已复制到剪贴板');
				});
			});
		};

		// 打印按钮
		const printBtn = buttons.createEl('button', { text: '打印预览' });
		printBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; background: #2196F3; color: white; border: none; border-radius: 4px;';
		printBtn.onclick = () => this.triggerPrint();

		// 关闭按钮
		const closeBtn = buttons.createEl('button', { text: '关闭' });
		closeBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;';
		closeBtn.onclick = () => this.close();

		// 创建iframe容器
		const iframeContainer = contentEl.createDiv();
		iframeContainer.style.cssText = `
			flex: 1;
			overflow: hidden;
			height: calc(95vh - 120px);
		`;

		// 创建iframe
		const iframe = iframeContainer.createEl('iframe');
		iframe.style.cssText = `
			width: 100%;
			height: 100%;
			border: none;
			background: white;
		`;
		iframe.id = 'pdf-preview-iframe';

		// 写入内容到iframe
		const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(this.buildFullHTML());
			iframeDoc.close();
		}
	}

	triggerPrint() {
		const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.print();
		}
	}

	buildFullHTML(): string {
		const fontSize = this.settings.fontSize;
		const lineHeight = this.settings.lineHeight;
		const includeTitle = this.settings.includeTitle;

		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${this.title}</title>
	<style>
		* { box-sizing: border-box; }

		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
			font-size: ${fontSize}px;
			line-height: ${lineHeight};
			color: #000;
			background: #fff;
			margin: 0;
			padding: 20px;
		}

		h1, h2, h3, h4, h5, h6 {
			margin-top: 1.5em;
			margin-bottom: 0.5em;
			font-weight: 600;
			line-height: 1.3;
		}

		h1 { font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
		h2 { font-size: 1.5em; border-bottom: 1px solid #666; padding-bottom: 0.3em; }
		h3 { font-size: 1.25em; }
		h4 { font-size: 1.1em; }
		h5 { font-size: 1em; }
		h6 { font-size: 0.9em; color: #666; }

		p { margin: 1em 0; }

		a { color: #0366d6; text-decoration: none; }

		code {
			font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
			font-size: 0.9em;
			background-color: #f6f8fa;
			padding: 0.2em 0.4em;
			border-radius: 3px;
		}

		pre {
			background-color: #f6f8fa;
			border: 1px solid #d1d5da;
			border-radius: 6px;
			padding: 16px;
			overflow-x: auto;
			font-size: 0.85em;
			line-height: 1.45;
		}

		pre code {
			background: none;
			padding: 0;
			font-size: inherit;
		}

		blockquote {
			margin: 1em 0;
			padding: 0.5em 1em;
			border-left: 4px solid #dfe2e5;
			color: #6a737d;
			background-color: #f8f9fa;
		}

		ul, ol {
			margin: 1em 0;
			padding-left: 2em;
		}

		li { margin: 0.25em 0; }

		table {
			border-collapse: collapse;
			width: 100%;
			margin: 1em 0;
		}

		th, td {
			border: 1px solid #dfe2e5;
			padding: 8px 12px;
			text-align: left;
		}

		th {
			background-color: #f6f8fa;
			font-weight: 600;
		}

		tr:nth-child(even) { background-color: #f8f9fa; }

		hr {
			border: none;
			border-top: 2px solid #dfe2e5;
			margin: 2em 0;
		}

		img { max-width: 100%; height: auto; }

		.document-title {
			font-size: 2.2em;
			font-weight: 700;
			margin-bottom: 1em;
			padding-bottom: 0.5em;
			border-bottom: 3px solid #333;
		}

		@media print {
			body { padding: 0; }
			h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
			pre, blockquote, table, img { page-break-inside: avoid; }
		}
	</style>
</head>
<body>
	${includeTitle ? `<h1 class="document-title">${this.title}</h1>` : ''}
	<div class="markdown-content">${this.content}</div>
</body>
</html>`;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class PDFExportPlugin extends Plugin {
	settings: PDFExportSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'export-current-note-to-pdf',
			name: '导出当前笔记为 PDF',
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					if (!checking) {
						this.exportCurrentNoteToPDF();
					}
					return true;
				}
				return false;
			}
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('导出为 PDF')
							.setIcon('file-text')
							.onClick(async () => {
								await this.exportFileToPDF(file);
							});
					});
				}
			})
		);

		this.addSettingTab(new PDFExportSettingTab(this.app, this));

		console.log('PDF Export Plugin loaded (Modal + Iframe Method)');
	}

	onunload() {
		console.log('PDF Export Plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async exportCurrentNoteToPDF() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('没有打开的笔记');
			return;
		}

		const file = activeView.file;
		if (!file) {
			new Notice('无法获取当前文件');
			return;
		}

		await this.exportFileToPDF(file);
	}

	async exportFileToPDF(file: TFile) {
		try {
			new Notice('正在准备 PDF 预览...');

			const content = await this.app.vault.read(file);
			const renderedContent = await this.renderMarkdownToHTML(content);

			// 打开预览模态框
			const modal = new PDFPreviewModal(this.app, renderedContent, file.basename, this.settings);
			modal.open();

		} catch (error) {
			console.error('PDF export error:', error);
			new Notice('PDF 导出失败: ' + (error.message || '未知错误'), 10000);
		}
	}

	async renderMarkdownToHTML(markdown: string): Promise<string> {
		const container = document.createElement('div');
		const component = new Component();
		component.load();

		try {
			await MarkdownRenderer.render(
				this.app,
				markdown,
				container,
				'',
				component
			);
		} finally {
			component.unload();
		}

		return container.innerHTML;
	}
}

class PDFExportSettingTab extends PluginSettingTab {
	plugin: PDFExportPlugin;

	constructor(app: App, plugin: PDFExportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'PDF 导出设置' });
		containerEl.createEl('p', {
			text: '此插件使用系统原生打印功能生成 PDF，无内存限制问题。'
		});

		new Setting(containerEl)
			.setName('字体大小')
			.setDesc('PDF 中的基础字体大小（像素）')
			.addSlider(slider => slider
				.setLimits(10, 24, 1)
				.setValue(this.plugin.settings.fontSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.fontSize = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('行高')
			.setDesc('文本行高倍数')
			.addSlider(slider => slider
				.setLimits(1.2, 2.0, 0.1)
				.setValue(this.plugin.settings.lineHeight)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.lineHeight = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('包含标题')
			.setDesc('在 PDF 开头显示文档标题')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeTitle)
				.onChange(async (value) => {
					this.plugin.settings.includeTitle = value;
					await this.plugin.saveSettings();
				}));
	}
}
