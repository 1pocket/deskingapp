// pages/_app.js
import "../styles/globals.css";  // <-- change from "@/styles/globals.css"

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
