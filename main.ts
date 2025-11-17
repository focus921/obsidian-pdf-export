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

class PDFPreviewModal extends Modal {
	private content: string;
	private title: string;
	private settings: PDFExportSettings;
	private iframeEl: HTMLIFrameElement | null = null;

	constructor(app: App, content: string, title: string, settings: PDFExportSettings) {
		super(app);
		this.content = content;
		this.title = title;
		this.settings = settings;
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;

		modalEl.addClass('pdf-export-modal');

		const toolbar = contentEl.createDiv({ cls: 'pdf-export-toolbar' });

		const instructions = toolbar.createDiv({ cls: 'pdf-export-instructions' });

		if (Platform.isMobile) {
			const strong1 = instructions.createEl('strong');
			strong1.setText('iOS export steps:');
			instructions.createEl('br');
			instructions.appendText('1. Click "Copy HTML" button below');
			instructions.createEl('br');
			instructions.appendText('2. Open Safari and paste URL');
			instructions.createEl('br');
			instructions.appendText('3. Use Share → Print → Save PDF');
		} else {
			const strong2 = instructions.createEl('strong');
			strong2.setText('Desktop:');
			instructions.appendText(' Click "Print" button or press Ctrl/Cmd+P');
		}

		const buttons = toolbar.createDiv({ cls: 'pdf-export-buttons' });

		const copyBtn = buttons.createEl('button', {
			text: 'Copy HTML',
			cls: 'pdf-export-btn pdf-export-btn-copy'
		});
		copyBtn.addEventListener('click', () => {
			this.copyHTML();
		});

		const printBtn = buttons.createEl('button', {
			text: 'Print preview',
			cls: 'pdf-export-btn pdf-export-btn-print'
		});
		printBtn.addEventListener('click', () => {
			this.triggerPrint();
		});

		const closeBtn = buttons.createEl('button', {
			text: 'Close',
			cls: 'pdf-export-btn pdf-export-btn-close'
		});
		closeBtn.addEventListener('click', () => {
			this.close();
		});

		const iframeContainer = contentEl.createDiv({ cls: 'pdf-export-iframe-container' });

		this.iframeEl = iframeContainer.createEl('iframe', { cls: 'pdf-export-iframe' });
		this.iframeEl.setAttribute('srcdoc', this.buildFullHTML());
	}

	private copyHTML(): void {
		const htmlContent = this.buildFullHTML();
		const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);

		navigator.clipboard.writeText(dataUrl)
			.then(() => {
				new Notice('HTML data URL copied! Paste in Safari address bar');
			})
			.catch(() => {
				navigator.clipboard.writeText(htmlContent)
					.then(() => {
						new Notice('HTML copied to clipboard');
					})
					.catch((err) => {
						console.error('Failed to copy:', err);
						new Notice('Failed to copy HTML');
					});
			});
	}

	private triggerPrint(): void {
		if (this.iframeEl?.contentWindow) {
			this.iframeEl.contentWindow.print();
		}
	}

	private buildFullHTML(): string {
		const fontSize = this.settings.fontSize;
		const lineHeight = this.settings.lineHeight;
		const includeTitle = this.settings.includeTitle;

		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${this.escapeHTML(this.title)}</title>
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
	${includeTitle ? `<h1 class="document-title">${this.escapeHTML(this.title)}</h1>` : ''}
	<div class="markdown-content">${this.content}</div>
</body>
</html>`;
	}

	private escapeHTML(text: string): string {
		const div = document.createElement('div');
		div.appendChild(document.createTextNode(text));
		return div.innerHTML;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.iframeEl = null;
	}
}

export default class PDFExportPlugin extends Plugin {
	settings: PDFExportSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: 'export-current-note-to-pdf',
			name: 'Export current note to PDF',
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					if (!checking) {
						void this.exportCurrentNoteToPDF();
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
							.setTitle('Export to PDF')
							.setIcon('file-text')
							.onClick(() => {
								void this.exportFileToPDF(file);
							});
					});
				}
			})
		);

		this.addSettingTab(new PDFExportSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async exportCurrentNoteToPDF(): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('No note is open');
			return;
		}

		const file = activeView.file;
		if (!file) {
			new Notice('Unable to get current file');
			return;
		}

		await this.exportFileToPDF(file);
	}

	private async exportFileToPDF(file: TFile): Promise<void> {
		try {
			new Notice('Preparing PDF preview...');

			const content = await this.app.vault.read(file);
			const renderedContent = await this.renderMarkdownToHTML(content);

			const modal = new PDFPreviewModal(this.app, renderedContent, file.basename, this.settings);
			modal.open();

		} catch (error) {
			console.error('PDF export error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			new Notice('PDF export failed: ' + errorMessage, 10000);
		}
	}

	private async renderMarkdownToHTML(markdown: string): Promise<string> {
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

		new Setting(containerEl)
			.setName('PDF export')
			.setHeading();

		containerEl.createEl('p', {
			text: 'This plugin uses system native print functionality to generate PDF, with no memory limitations.'
		});

		new Setting(containerEl)
			.setName('Font size')
			.setDesc('Base font size for PDF (pixels)')
			.addSlider(slider => slider
				.setLimits(10, 24, 1)
				.setValue(this.plugin.settings.fontSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.fontSize = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Line height')
			.setDesc('Text line height multiplier')
			.addSlider(slider => slider
				.setLimits(1.2, 2.0, 0.1)
				.setValue(this.plugin.settings.lineHeight)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.lineHeight = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include title')
			.setDesc('Show document title at the top of PDF')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeTitle)
				.onChange(async (value) => {
					this.plugin.settings.includeTitle = value;
					await this.plugin.saveSettings();
				}));
	}
}
