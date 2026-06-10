const fs = require('fs');
const path = require('path');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'notes');

const filesToDownload = [
  {
    name: 'data-structures.pdf',
    url: 'https://mrcet.com/pdf/Lab%20Manuals/IT/PYTHON%20PROGRAMMING.pdf'
  },
  {
    name: 'calculus-past-questions.pdf',
    url: 'https://www.math.caltech.edu/~courses/ma1a/notes/calculus.pdf'
  },
  {
    name: 'business-law.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    name: 'signals-formulas.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    name: 'constitutional-law.pdf',
    url: 'https://www.law.berkeley.edu/wp-content/uploads/2015/07/Constitutional-Law-Notes.pdf'
  },
  {
    name: 'pharmacology-drugs.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

const DUMMY_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file async if error
      reject(err);
    });
  });
}

// Minimal valid PDF binary data as string fallback (1-page empty PDF)
const MINIMAL_PDF_BASE64 = 
  'JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQogICAgIC9SZXNvdXJjZXMgPDwKICAgICAgICAvRm9udCA8PAogICAgICAgICAgIC9GMSA0IDAgUgogICAgICAgID4+CiAgICAgPj4KICAgICAvQ29udGVudHMgNSAwIFIKICA+PgplbmRvYmoKNCAwIG9iagogIDw8IC9UeXBlIC9Gb250CiAgICAgL1N1YnR5cGUgL1R5cGUxCiAgICAgL0Jhc2VGb250IC9IZWx2ZXRpY2EKICA+PgplbmRvYmoKNSAwIG9iago8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZApKKExlY3R1cmUgTm90ZXMgUGxhY2Vob2xkZXIpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDAzMjQgMDAwMDAgbiAKdHJhaWxlcgowIDYgPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDE0CiUlRU9GCg==';

async function main() {
  console.log(`Creating uploads folder: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // Download files
  for (const item of filesToDownload) {
    const dest = path.join(UPLOADS_DIR, item.name);
    console.log(`Downloading ${item.name}...`);
    try {
      await downloadFile(item.url, dest);
      console.log(`Successfully downloaded ${item.name}`);
    } catch (err) {
      console.warn(`Failed to download ${item.name} from primary URL: ${err.message}. Trying stable dummy PDF...`);
      try {
        await downloadFile(DUMMY_PDF_URL, dest);
        console.log(`Successfully downloaded ${item.name} as dummy PDF.`);
      } catch (fallbackErr) {
        console.error(`Failed to download fallback for ${item.name}: ${fallbackErr.message}. Creating minimal valid PDF locally...`);
        try {
          fs.writeFileSync(dest, Buffer.from(MINIMAL_PDF_BASE64, 'base64'));
          console.log(`Successfully generated minimal local PDF for ${item.name}`);
        } catch (writeErr) {
          console.error(`Critical error: could not write local fallback for ${item.name}: ${writeErr.message}`);
        }
      }
    }
  }

  // Also create placeholder PPT and DOCX files
  const placeholderDocs = [
    { name: 'anatomy-slides.ppt', text: 'Introduction to Anatomy Slides' },
    { name: 'mass-media.docx', text: 'Mass Media and Society Handout Document' },
    { name: 'design-principles.ppt', text: 'Architecture Design Principles Slides' }
  ];

  for (const doc of placeholderDocs) {
    const dest = path.join(UPLOADS_DIR, doc.name);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, doc.text);
      console.log(`Created text placeholder for ${doc.name}`);
    }
  }

  console.log('Lecture notes setup complete!');
}

main().catch(console.error);
