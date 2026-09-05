import { pageMetadata } from "../../lib/seo";

// contact/page.js is a Client Component ("use client"), so this sibling
// layout carries the route's metadata instead.
export const metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with the Globeing team — send feedback, report an issue, or say hello.",
  path: "/contact",
});

export default function ContactLayout({ children }) {
  return children;
}
