import { useState, useEffect, useCallback } from 'react';
import './App.css';

type ImageState = {
  originalFile: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
};

type ProcessingStatus = 'idle' | 'uploading' | 'done' | 'error';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [image, setImage] = useState<ImageState | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('removebg_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('removebg_api_key', apiKey);
    }
  }, [apiKey]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (image?.originalUrl) URL.revokeObjectURL(image.originalUrl);
      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    };
  }, [image, processedImageUrl]);

  const handleFile = useCallback((file: File) => {
    setError('');
    setStatus('idle');
    
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件 (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('图片大小不能超过 30MB');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage({
        originalFile: file,
        originalUrl: url,
        originalWidth: img.width,
        originalHeight: img.height,
      });
      setProcessedImageUrl(null);
    };
    img.src = url;
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeBackground = async () => {
    if (!image) return;
    if (!apiKey.trim()) {
      setError('请输入你的 Remove.bg API Key');
      return;
    }

    setStatus('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image_file', image.originalFile);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey.trim(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: '未知错误' } }));
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
      }

      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);
      
      setProcessedImageUrl(processedUrl);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '处理失败，请检查 API Key 是否正确');
    }
  };

  const downloadResult = () => {
    if (!processedImageUrl || !image) return;
    
    const originalName = image.originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const downloadName = `${nameWithoutExt}_removed.png`;

    const a = document.createElement('a');
    a.href = processedImageUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearApiKey = () => {
    if (confirm('确定要清除保存的 API Key 吗？')) {
      setApiKey('');
      localStorage.removeItem('removebg_api_key');
    }
  };

  const resetAll = () => {
    if (image?.originalUrl) URL.revokeObjectURL(image.originalUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    setImage(null);
    setProcessedImageUrl(null);
    setStatus('idle');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">🖼️ 图片背景移除工具</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">
            Powered by Remove.bg API • 所有图片仅在前端处理 • 自动部署测试
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* API Key Section */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remove.bg API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key，会保存在本地浏览器"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {apiKey && (
                  <button
                    onClick={clearApiKey}
                    className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-md transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            <a
              href="https://www.remove.bg/api"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-md transition-colors inline-flex items-center gap-1"
            >
              获取 API Key →
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 免费版每月可处理 50 张图片，API Key 仅保存在你的浏览器中，不会上传到任何服务器
          </p>
        </section>

        {/* Error Message */}
        {error && (
          <section className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <div className="flex-1">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </section>
        )}

        {/* Upload Area */}
        {!image && (
          <section
            className={`mb-8 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 bg-white dark:bg-gray-800'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-semibold mb-2">拖拽图片到这里或点击选择</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              支持 JPG、PNG、WEBP，最大 30MB
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <span className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md cursor-pointer transition-colors font-medium">
                选择图片
              </span>
            </label>
          </section>
        )}

        {/* Image Preview & Processing */}
        {image && (
          <>
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">预览对比</h2>
                <button
                  onClick={resetAll}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  重新上传
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <h3 className="font-medium">原图</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {image.originalWidth} × {image.originalHeight} •{' '}
                      {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="p-4 flex justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a] bg-[radial-gradient(#ccc_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:16px_16px]">
                    <img
                      src={image.originalUrl}
                      alt="Original"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                </div>

                {/* Processed Image */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <h3 className="font-medium">处理后</h3>
                    {status === 'done' && processedImageUrl && (
                      <p className="text-xs text-green-600 dark:text-green-400">处理完成</p>
                    )}
                    {status === 'uploading' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">处理中...</p>
                    )}
                  </div>
                  <div className="p-4 flex justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a] bg-[radial-gradient(#ccc_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:16px_16px] min-h-[200px]">
                    {status === 'uploading' && (
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p>正在移除背景...</p>
                      </div>
                    )}
                    {status === 'done' && processedImageUrl && (
                      <img
                        src={processedImageUrl}
                        alt="Processed"
                        className="max-w-full max-h-[400px] object-contain"
                      />
                    )}
                    {status === 'idle' && !processedImageUrl && (
                      <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <p>点击下方按钮开始处理</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
              {status !== 'done' && (
                <button
                  onClick={removeBackground}
                  disabled={status === 'uploading' || !apiKey.trim()}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors flex-1 sm:flex-none min-w-[200px]"
                >
                  {status === 'uploading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block"></span>
                      处理中...
                    </span>
                  ) : (
                    '开始移除背景'
                  )}
                </button>
              )}
              {status === 'done' && processedImageUrl && (
                <button
                  onClick={downloadResult}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors flex-1 sm:flex-none min-w-[200px]"
                >
                  💾 下载 PNG 图片
                </button>
              )}
            </section>
          </>
        )}

        {/* Info & Privacy */}
        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">ℹ️ 关于本工具</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <li>• 🔒 <strong>隐私保护：</strong>您的 API Key 只保存在自己浏览器中，不会上传到任何第三方服务器</li>
            <li>• 📤 <strong>图片处理：</strong>图片仅发送到 Remove.bg API 进行处理，本网站不存储任何图片</li>
            <li>• ☁️ <strong>部署：</strong>纯前端静态网站，部署在 Cloudflare Pages，无需后端服务器</li>
            <li>• 🎁 <strong>免费额度：</strong>Remove.bg 免费账户每月可处理 50 张图片，超出需要付费升级</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Built with React •{' '}
          <a
            href="https://www.remove.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-purple-600 dark:hover:text-purple-400"
          >
            Powered by Remove.bg
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
