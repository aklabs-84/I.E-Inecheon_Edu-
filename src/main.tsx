import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Remove any UI element that contains the exact text '폴더' (Korean for "folder").
// This runs at app startup and also watches for dynamically added elements.
function removeFolderElements(root: ParentNode = document) {
	try {
		const candidates = Array.from(root.querySelectorAll('button, a, span, div, li'));
		candidates.forEach((el) => {
			const text = (el.textContent || '').trim();
			if (text && text.includes('폴더')) {
				el.remove();
			}
			const title = (el.getAttribute && (el.getAttribute('title') || el.getAttribute('aria-label')));
			if (title && title.includes && title.includes('폴더')) el.remove();
		});
	} catch (e) {
		// ignore
		// eslint-disable-next-line no-console
		console.error('Error removing 폴더 elements:', e);
	}
}

// Run once on startup
if (typeof document !== 'undefined') {
	// Remove already-present elements
	removeFolderElements(document);

	// Observe future DOM changes and remove nodes containing the text
	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.addedNodes && m.addedNodes.length > 0) {
				m.addedNodes.forEach((node) => {
					if (node instanceof Element) removeFolderElements(node);
				});
			}
		}
	});
	observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
}

createRoot(document.getElementById("root")!).render(<App />);
