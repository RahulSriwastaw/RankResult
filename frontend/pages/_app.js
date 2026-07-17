import '@/styles/globals.css';
import 'react-quill/dist/quill.snow.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import '@/utils/firebase';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <Toaster position="top-center" reverseOrder={false} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}