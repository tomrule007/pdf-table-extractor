import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fabric } from 'fabric';

import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function TemplateCreator({ file, chars }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [charInfo, setCharInfo] = useState([]);
  const [template, setTemplate] = useState({
    top: null,
    left: null,
    bottom: null,
    right: null,
    columns: []
  });
  useEffect(() => {
    if (chars && chars.pages) {
      setCharInfo(chars.pages[0]);
    }
  }, [chars]);
  useEffect(() => {
    const fetchPdf = async () => {
      const loadingTask = pdfjs.getDocument(file);

      const pdf = await loadingTask.promise;

      const firstPageNumber = 1;

      const page = await pdf.getPage(firstPageNumber);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      // Prepare canvas using PDF page dimensions
      const canvas = canvasRef.current;

      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport
      };
      const renderTask = page.render(renderContext);

      await renderTask.promise;

      // convert canvas to background image to import into fabric canvas
      const bg = canvas.toDataURL('image/png');
      const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
        width: viewport.width,
        height: viewport.height
      });
      fabricCanvas.setBackgroundImage(
        bg,
        fabricCanvas.renderAll.bind(fabricCanvas)
      );

      const rect = new fabric.Rect({
        name: 'table',
        left: 100,
        top: 100,
        strokeWidth: 2,
        stroke: 'red',
        fill: 'rgba(0,0,0,0)',
        cornerColor: 'rgba(0,0,0,1)',
        strokeUniform: true,
        width: 200,
        height: 200,
        transparentCorners: false,
        hasBorders: false
      });

      rect.setControlsVisibility({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        bl: false,
        br: false,
        tl: false,
        tr: false,
        mtr: false
      });
      fabricCanvas.add(rect);

      let { columns } = template;
      let { top } = template;
      let { left } = template;
      let { bottom } = template;
      let { right } = template;

      fabricCanvas.on('object:modified', e => {
        const o = e.target;
        //   console.log(o.aCoords);
        if (o.name === 'table') {
          top = o.aCoords.tl.y;
          left = o.aCoords.tl.x;
          bottom = o.aCoords.br.y;
          right = o.aCoords.br.x;

          setTemplate({ top, left, bottom, right, columns });
        }
      });
      fabricCanvas.on('mouse:down', e => {
        if (e.e.shiftKey && e.target && e.target.name === 'table') {
          const { x } = e.pointer;
          const topTarget = e.target.aCoords.tl.y;
          const bottomTarget = e.target.aCoords.bl.y;
          const line = new fabric.Line([x, top, x, bottom], {
            fill: 'red',
            stroke: 'red',
            strokeWidth: 2,
            selectable: true
            // evented: false
          });
          fabricCanvas.add(line);
          columns = [...columns, x].sort();
          setTemplate({
            top: topTarget,
            left,
            bottom: bottomTarget,
            right,
            columns
          });
        }
      });
      // console.log(charArray);
    };

    if (file !== null) fetchPdf();
  }, [file]);

  const tableChars = charInfo.filter(char => {
    const isInbounds =
      template.top &&
      char.y >= template.top &&
      char.y <= template.bottom &&
      char.x <= template.right &&
      char.x >= template.left;
    // console.log(char.y, isInbounds);
    return isInbounds;
  });

  const columnChars = tableChars.reduce((acc, char) => {
    const { x } = char;
    const columnID = template.columns.findIndex(columnX => x < columnX);

    acc[columnID] =
      acc[columnID] === undefined ? [char] : [...acc[columnID], char];

    return acc;
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ display: 'none' }}
      />
      <canvas
        ref={fabricCanvasRef}
        width={500}
        height={500}
        style={{ border: '1px solid black' }}
      />
      <p>
        Total Chars: {charInfo.length} Table Chars: {tableChars.length}
      </p>
      <p>table boundaries: {JSON.stringify(template)}</p>
      {columnChars.map((_, columnIndex) => (
        <span>{`Column Index ${columnIndex}`}</span>
      ))}
      <ul>
        {tableChars.map(char => (
          <li>{`${char.text} (x: ${char.x.toFixed(2)} y: ${char.y.toFixed(
            2
          )})`}</li>
        ))}
      </ul>
    </>
  );
}

TemplateCreator.propTypes = {
  file: PropTypes.shape({
    data: PropTypes.array.isRequired
  }),
  chars: PropTypes.shape({
    pages: PropTypes.array.isRequired
  })
};

TemplateCreator.defaultProps = {
  file: null,
  chars: null
};
