/**
 * Image export utilities — HTML to PNG via SVG foreignObject + Canvas.
 */

export async function htmlToImage(htmlString, width = 1440, height = 900) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:-${width + 100}px;top:0;width:${width}px;height:${height}px;border:none;visibility:hidden;`;
    iframe.sandbox = 'allow-same-origin';
    document.body.appendChild(iframe);

    iframe.srcdoc = htmlString;
    iframe.onload = () => {
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            reject(new Error('无法访问 iframe 内容进行截图'));
            return;
          }

          const body = iframeDoc.body;
          const svgData = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">${body.innerHTML}</div>
              </foreignObject>
            </svg>`;

          const img = new Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            document.body.removeChild(iframe);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('图片生成失败'));
            }, 'image/png');
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            document.body.removeChild(iframe);
            reject(new Error('SVG 渲染失败，请尝试使用 HTML 导出'));
          };

          img.src = url;
        } catch (err) {
          document.body.removeChild(iframe);
          reject(err);
        }
      }, 500);
    };
  });
}

export async function capturePageAsImage(htmlString, width = 1440, height = 900) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;border:none;`;
    iframe.sandbox = 'allow-same-origin';
    document.body.appendChild(iframe);

    iframe.srcdoc = htmlString;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('截图超时'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (iframe.parentNode) document.body.removeChild(iframe);
    };

    iframe.onload = () => {
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          const doc = iframe.contentDocument;
          if (!doc) {
            cleanup();
            reject(new Error('无法访问页面内容'));
            return;
          }

          const serializer = new XMLSerializer();
          const htmlClone = doc.documentElement.cloneNode(true);
          const htmlStr = serializer.serializeToString(htmlClone);

          const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <foreignObject width="100%" height="100%">
              ${htmlStr}
            </foreignObject>
          </svg>`;

          const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            cleanup();
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas 导出失败'));
            }, 'image/png');
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            cleanup();
            reject(new Error('图片渲染失败'));
          };

          img.src = url;
        } catch (err) {
          cleanup();
          reject(err);
        }
      }, 800);
    };
  });
}
