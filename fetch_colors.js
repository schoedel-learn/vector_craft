const response = await fetch('https://schoedel.design');
const data = await response.text();

const styleTags = data.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
const allStyles = styleTags.join('\n');

const bodyStyles = allStyles.match(/body\s*{[^}]*}/gi);
console.log("Body styles:", bodyStyles ? bodyStyles.join('\n') : "Not found");

const htmlStyles = allStyles.match(/html\s*{[^}]*}/gi);
console.log("HTML styles:", htmlStyles ? htmlStyles.join('\n') : "Not found");

