import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Vaulted</title>
        {/* Travelpayouts verification — must run before app bundle */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=document.createElement("script");s.async=1;s.src="https://tpembars.com/NTQwNTk0.js?t=540594";document.head.appendChild(s)})();`,
          }}
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body,#root{background-color:#0A0A0A;}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
