import React, { useState } from 'react';

const FileUpload = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file)); // Create a preview URL
      if (onFileSelect) {
        onFileSelect(file); // Pass the file to the parent component
      }
    } else {
      setSelectedFile(null);
      setPreview(null);
      if (onFileSelect) {
        onFileSelect(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        type="file"
        accept="image/*" // Accept only image files
        onChange={handleFileChange}
        className="mb-4 w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-purple-50 file:text-purple-700
                   hover:file:bg-purple-100"
      />
      {selectedFile && (
        <div className="text-center">
          <p className="text-sm text-gray-700 mb-2">
            Fichier sélectionné : {selectedFile.name}
          </p>
          {preview && (
            <img
              src={preview}
              alt="Aperçu"
              className="max-h-48 max-w-xs rounded-lg shadow-md"
            />
          )}
        </div>
      )}
      {!selectedFile && (
        <p className="text-sm text-gray-500">
          Cliquez pour choisir une image (ex: photo de la chambre, jouets à trier).
        </p>
      )}
    </div>
  );
};

export default FileUpload;