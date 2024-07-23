import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const DropZone = ({ onFileUpload, value, onChange, errors,  pdf=false  }) => {
    const [files, setFiles] = useState(value || []);

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles);
        onChange(acceptedFiles);
        onFileUpload(acceptedFiles);
    }, [onChange, onFileUpload]);

    const removeFile = fileName => {
        const newFiles = files?.filter(file => file?.name !== fileName);
        setFiles(newFiles);
        onChange(newFiles);
        onFileUpload(newFiles);
    };
    const handleRemoveFile = (index) => {
        setFiles((prevFiles) => {
            const newFiles = [...prevFiles];
            newFiles.splice(index, 1);
            return newFiles;
        });
        onChange(files.filter((_, i) => i !== index));
    };

    useEffect(() => {
        setFiles(value);
    }, [value]);
    console.log(files,"filesfiles");

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: pdf
        ? {
            "image/*": [".png", ".jpg", ".jpeg"],
            // "video/*": [".mp4", ".avi", ".mov"],
            "application/pdf": [".pdf"],
          }
        : {
            "image/*": [".png", ".jpg", ".jpeg"],
            // "video/*": [".mp4", ".avi", ".mov"],
          },
           onDrop });

    return (
        <div className="w-full max-w-md ">
            <div
                {...getRootProps()}
                className={`flex items-center justify-center w-full rounded-md cursor-pointer ${
                    isDragActive ? 'border-blue-600' : 'border-gray-300'
                }`}
            >
                <input {...getInputProps()} className="hidden" />
                <div className="flex items-center gap-2 w-full px-4 py-2 bg-white border rounded-md border-gray-300">
                    <span className="text-gray-600">
                        {isDragActive ? 'Drop the files here ...' : 'Choose Files'}
                    </span>
                    <span className="text-gray-500">
                        {files?.length > 1 ? `${files.length} files selected` : files?.length === 1 ? files[0]?.name : ''}
                    </span>
                </div>
            </div>
            {files?.length > 0 && (
                <div className="mt-4">
                    <ul className="list-disc list-inside bg-white p-4">
                        {files?.map((file, index) => (
                            
                            <li key={index} className="flex justify-between items-center text-gray-800">
                                {file.name || files[index].split("/").pop()}
                                <button
                                type='button'
                                    onClick={() => handleRemoveFile(index)}
                                    className="text-red-600 underline ml-2"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {errors && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
        </div>
    );
};

export default DropZone;
