import './globals.css';

export const metadata = {
  title: 'OpenInspect',
  description: 'AI-powered component inspection training platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
