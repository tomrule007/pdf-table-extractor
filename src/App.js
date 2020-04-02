import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import localForage from 'localforage';

import FileInput from './components/FileInput';
import PdfData from './components/PdfData';

import defaultTemplateFile from './sampleFiles/sampleTables.json';
import defaultPdfFile from './sampleFiles/sampleTables.pdf';

import TemplateCreator from './components/TemplateCreator';
import MyDropzone from './components/MyDropzone/MyDropzone';

import { loadFiles } from './feature/file/fileSlice';

function App() {
  const dispatch = useDispatch();
  const files = useSelector(state => state.file.files);
  const [templateFile, setTemplateFile] = useState(defaultTemplateFile);
  const [pdfFile, setPdfFile] = useState(defaultPdfFile);

  useEffect(() => {
    const fileRef = files[files.length - 1];
    if (fileRef) {
      switch (fileRef.type) {
        case 'application/pdf':
          localForage
            .getItem(fileRef.key)
            .then(file => file.arrayBuffer())
            .then(setPdfFile);
          break;
        case 'application/json':
          localForage
            .getItem(fileRef.key)
            .then(file => file.text())
            .then(JSON.parse)
            .then(setTemplateFile);
          break;
        default:
          break;
      }
    }
  }, [files]);
  const handlePdfFileChange = e => dispatch(loadFiles(e.target.files));
  const handleTemplateFileChange = e => dispatch(loadFiles(e.target.files));
  return (
    <div className="App">
      <FileInput
        labelText="Select a pdf file:"
        accept=".pdf"
        onChange={handlePdfFileChange}
        htmlFor="pdfInput"
      />
      <FileInput
        labelText="Select a template file:"
        accept=".json"
        onChange={handleTemplateFileChange}
        htmlFor="templateInput"
      />
      <span>
        {'Download: '}
        <a
          href={`${process.env.PUBLIC_URL}/pdfs/sampleTables.pdf`}
          download="sampleTable.pdf"
        >
          sampleTable.pdf
        </a>
        {' / '}
        <a
          href={`${process.env.PUBLIC_URL}/templates/sampleTables.json`}
          download="sampleTable.json"
        >
          sampleTable.json
        </a>
        {' / '}
        <a
          href={`${process.env.PUBLIC_URL}/templates/invoice.json`}
          download="invoice.json"
        >
          invoice.json
        </a>
      </span>

<<<<<<< HEAD
=======
      <MyDropzone />
>>>>>>> Create/Add MyDropzone component
      <PdfData pdf={pdfFile} template={templateFile} />
      <TemplateCreator file={pdfFile} />
    </div>
  );
}

export default App;
