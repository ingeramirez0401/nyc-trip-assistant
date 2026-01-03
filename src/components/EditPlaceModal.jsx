import React, { useState, useRef } from 'react';
import { categories } from '../data/categories';

const EditPlaceModal = ({ place, onSave, onClose }) => {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-down">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
          <h2 className="font-bold text-lg text-slate-800">Editar Lugar</h2>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del lugar</label>
            <input 
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Times Square"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleChange('cat', cat.name)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.cat === cat.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <i className={`fas ${cat.icon} text-xl mb-1`} style={{ color: cat.color }}></i>
                  <p className="text-xs font-medium text-slate-700 truncate">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Consejo</label>
            <textarea 
              value={formData.tip}
              onChange={(e) => handleChange('tip', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows="3"
              placeholder="Ej: Mejor vista desde las escaleras rojas"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tiempo sugerido</label>
            <input 
              type="text"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 45 min"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Imagen</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {showImage ? (
                <div className="relative">
                  <img src={currentImage} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                  <button 
                    onClick={() => {
                      setUploadedImage(null);
                      handleChange('img', '');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 text-gray-400 hover:text-blue-600 transition"
                >
                  <i className="fas fa-camera text-3xl mb-2"></i>
                  <p className="text-sm font-medium">Toca para cambiar la foto</p>
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
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            <i className="fas fa-save mr-2"></i>
            Guardar cambios
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlaceModal;
