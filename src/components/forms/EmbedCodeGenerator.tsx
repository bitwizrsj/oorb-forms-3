import React, { useState } from 'react';
import { Code, Copy, Eye, Settings, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmbedCodeGeneratorProps {
  form: any;
  onClose: () => void;
}

const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ form, onClose }) => {
  const [embedType, setEmbedType] = useState<'iframe' | 'react' | 'html'>('iframe');
  const [customization, setCustomization] = useState({
    width: '100%',
    height: '600px',
    theme: 'light',
    primaryColor: '#3B82F6',
    borderRadius: '8px',
    showBranding: true
  });

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/${form.shareUrl}`;
    
    switch (embedType) {
      case 'iframe':
        return `<iframe 
  src="${formUrl}?embed=true&theme=${customization.theme}&color=${encodeURIComponent(customization.primaryColor)}&branding=${customization.showBranding}"
  width="${customization.width}"
  height="${customization.height}"
  frameborder="0"
  style="border-radius: ${customization.borderRadius};"
  title="${form.title}">
</iframe>`;

      case 'react':
        return `import { OorbForm } from '@oorb/forms-react';

function MyComponent() {
  return (
    <OorbForm
      formId="${form.shareUrl}"
      width="${customization.width}"
      height="${customization.height}"
      theme="${customization.theme}"
      primaryColor="${customization.primaryColor}"
      borderRadius="${customization.borderRadius}"
      showBranding={${customization.showBranding}}
      onSubmit={(data) => {
        console.log('Form submitted:', data);
      }}
    />
  );
}`;

      case 'html':
        return `<!-- OORB Forms Embed -->
<div id="oorb-form-${form.shareUrl}"></div>
<script src="https://cdn.oorb.com/forms.js"></script>
<script>
  OorbForms.render('${form.shareUrl}', {
    container: '#oorb-form-${form.shareUrl}',
    width: '${customization.width}',
    height: '${customization.height}',
    theme: '${customization.theme}',
    primaryColor: '${customization.primaryColor}',
    borderRadius: '${customization.borderRadius}',
    showBranding: ${customization.showBranding},
    onSubmit: function(data) {
      console.log('Form submitted:', data);
    }
  });
</script>`;

      default:
        return '';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast.success('Embed code copied to clipboard!');
  };

  const previewUrl = `${window.location.origin}/form/${form.shareUrl}?embed=true&theme=${customization.theme}&color=${encodeURIComponent(customization.primaryColor)}&branding=${customization.showBranding}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Embed Form</h2>
                <p className="text-gray-600">Generate embed code for your website</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configuration
                </h3>
                
                {/* Embed Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Embed Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'iframe', label: 'iFrame' },
                      { value: 'react', label: 'React' },
                      { value: 'html', label: 'HTML/JS' }
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setEmbedType(type.value as any)}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          embedType === type.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="text"
                      value={customization.width}
                      onChange={(e) => setCustomization(prev => ({ ...prev, width: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      value={customization.height}
                      onChange={(e) => setCustomization(prev => ({ ...prev, height: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Theme */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' }
                    ].map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setCustomization(prev => ({ ...prev, theme: theme.value }))}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          customization.theme === theme.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Border Radius */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius
                  </label>
                  <input
                    type="text"
                    value={customization.borderRadius}
                    onChange={(e) => setCustomization(prev => ({ ...prev, borderRadius: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Show Branding */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={customization.showBranding}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showBranding: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show OORB branding</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Preview
                </h3>
                <div className="border border-gray-200 rounded-sm p-4 bg-gray-50">
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="300"
                    frameBorder="0"
                    style={{ borderRadius: customization.borderRadius }}
                    title="Form Preview"
                  />
                </div>
              </div>
            </div>

            {/* Code */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Embed Code
              </h3>
              
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-sm overflow-x-auto text-sm">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {embedType === 'react' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-sm">
                  <h4 className="font-medium text-blue-900 mb-2">Installation</h4>
                  <code className="text-sm text-blue-800">npm install @oorb/forms-react</code>
                </div>
              )}

              {embedType === 'html' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-sm">
                  <h4 className="font-medium text-green-900 mb-2">CDN Link</h4>
                  <code className="text-sm text-green-800">https://cdn.oorb.com/forms.js</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;