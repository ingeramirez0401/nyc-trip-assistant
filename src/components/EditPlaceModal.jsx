import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { categories, getCategoryLabel } from '../data/categories';

const EditPlaceModal = ({ place, onSave, onClose }) => {
  const { t } = useTranslation(['editPlace', 'common']);
  const [formData, setFormData] = useState({
    title: place.title || '',
    cat: place.cat || 'Interés',
    tip: place.tip || '',
    time: place.time || '',
    img: place.img || ''
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [imageFile, setImageFile] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleSave = () => {
    const updatedPlace = {
      ...place,
      ...formData,
      img: uploadedImage || formData.img
    };
    onSave(updatedPlace);
  };

  const currentImage = uploadedImage || formData.img;
  const showImage = currentImage && (currentImage.startsWith('http') || currentImage.startsWith('data:image'));

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] animate-fade-in-down">

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 bg-slate-50 dark:bg-white/5">
          <button
            onClick={onClose}
            aria-label={t('common:actions.close')}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">{t('editPlace:title')}</h2>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t('editPlace:nameLabel')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600"
              placeholder={t('editPlace:namePlaceholder')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t('editPlace:categoryLabel')}</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleChange('cat', cat.name)}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                    formData.cat === cat.name
                      ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <i className={`fas ${cat.icon} text-lg`} style={{ color: formData.cat === cat.name ? '#60a5fa' : cat.color }}></i>
                  <p className={`text-[10px] font-bold truncate w-full text-center ${formData.cat === cat.name ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {getCategoryLabel(t, cat)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t('editPlace:tipLabel')}</label>
            <textarea
              value={formData.tip}
              onChange={(e) => handleChange('tip', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder-slate-400 dark:placeholder-slate-600"
              rows="3"
              placeholder={t('editPlace:tipPlaceholder')}
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t('editPlace:timeLabel')}</label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
              placeholder={t('editPlace:timePlaceholder')}
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t('editPlace:imageLabel')}</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-800/30 transition-colors">
              {showImage ? (
                <div className="relative group">
                  <img src={currentImage} alt="Preview" className="w-full h-40 object-cover rounded-xl shadow-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        handleChange('img', '');
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 hover:scale-100 transition"
                    >
                      <i className="fas fa-trash-alt mr-2"></i> {t('editPlace:removeImage')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                    <i className="fas fa-camera text-xl"></i>
                  </div>
                  <span className="text-sm font-bold">{t('editPlace:changePhoto')}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-white/10 flex gap-3 bg-slate-50 dark:bg-white/5">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-save"></i>
            {t('editPlace:save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlaceModal;
