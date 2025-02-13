import express from "express";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { marked } from "marked";
import ReactPDF from "@react-pdf/renderer";
import {
	Document,
	Page,
	Text,
	Link,
	View,
	StyleSheet,
} from "@react-pdf/renderer";
import { decode } from "html-entities";

const app = express();
const port = process.env.PORT || 3000;
const rootUrl = process.env.ROOT_URL || `http://localhost:${port}`;

// Create styles
const styles = StyleSheet.create({
	page: {
		padding: 50,
		fontFamily: "Helvetica",
	},
	heading1: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		marginTop: 20,
	},
	heading2: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 8,
		marginTop: 16,
	},
	paragraph: {
		fontSize: 12,
		marginBottom: 10,
	},
	link: {
		color: "blue",
		textDecoration: "underline",
	},
	listItem: {
		fontSize: 12,
		marginBottom: 5,
		flexDirection: "row",
	},
	bullet: {
		width: 10,
	},
});

// Convert markdown to React PDF components
function MarkdownToPDF({ markdown }: { markdown: string }) {
	const tokens = marked.lexer(markdown);

	// Helper function to convert special characters
	const formatText = (text: string) => {
		return decode(text);
	};

	return (
		<Document>
			<Page size="LETTER" style={styles.page}>
				{tokens.map((token, i) => {
					switch (token.type) {
						case "heading":
							const style =
								token.depth === 1 ? styles.heading1 : styles.heading2;
							return (
								<Text key={i} style={style}>
									{formatText(token.text)}
								</Text>
							);

						case "paragraph":
							if (token.tokens) {
								return (
									<Text key={i} style={styles.paragraph}>
										{token.tokens.map((t: any, j: number) => {
											if (t.type === "link") {
												return (
													<Link key={j} style={styles.link} src={t.href}>
														{formatText(t.text)}
													</Link>
												);
											}
											return formatText(t.text);
										})}
									</Text>
								);
							}
							return (
								<Text key={i} style={styles.paragraph}>
									{formatText(token.text)}
								</Text>
							);

						case "list":
							return (
								<View key={i}>
									{token.items.map((item: any, j: number) => (
										<View key={j} style={styles.listItem}>
											<Text style={styles.bullet}>• </Text>
											{item.tokens && item.tokens[0]?.type === "link" ? (
												<Link style={styles.link} src={item.tokens[0].href}>
													{formatText(item.tokens[0].text)}
												</Link>
											) : (
												<Text>{formatText(item.text)}</Text>
											)}
										</View>
									))}
								</View>
							);

						default:
							return null;
					}
				})}
			</Page>
		</Document>
	);
}

// Process nav tags and replace with markdown list
async function processNavTags(content: string) {
	const regex = /<nav\s+route="([^"]+)"\s*\/?>/g;
	const matches = content.matchAll(regex);
	let result = content;

	for (const match of matches) {
		const [fullMatch, route] = match;
		try {
			const dirPath = join(process.cwd(), "content", route);
			const files = await readdir(dirPath);

			// Create paragraphs with links instead of list items
			const links = files
				.filter((file) => file.endsWith(".md"))
				.map((file) => {
					const name = file.replace(".md", "");
					const title =
						name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");
					// Use ROOT_URL from environment
					return `[${title}](${rootUrl}/${route}/${name})`;
				})
				.map((link) => `${link}\n\n`)
				.join("");

			result = result.replace(fullMatch, links);
		} catch (error) {
			console.error(`Error processing nav for route "${route}":`, error);
			result = result.replace(fullMatch, "Error loading navigation");
		}
	}

	return result;
}

app.get("*", async (req, res) => {
	try {
		const pathName = req.path === "/" ? "index" : req.path.slice(1);
		const filePath = join(process.cwd(), "content", `${pathName}.md`);

		// Read and process the markdown
		let markdown = await readFile(filePath, "utf-8");
		markdown = await processNavTags(markdown);

		// Generate PDF using React-PDF
		const pdfStream = await ReactPDF.renderToStream(
			<MarkdownToPDF markdown={markdown} />
		);

		// Set response headers
		res.contentType("application/pdf");
		pdfStream.pipe(res);
	} catch (error) {
		// Create 404 PDF
		const NotFound = () => (
			<Document>
				<Page size="A4" style={styles.page}>
					<Text style={styles.heading1}>404 - Page Not Found</Text>
					<Text style={styles.paragraph}>
						The requested page could not be found.
					</Text>
				</Page>
			</Document>
		);

		res.status(404);
		res.contentType("application/pdf");
		const pdfStream = await ReactPDF.renderToStream(<NotFound />);
		pdfStream.pipe(res);
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
