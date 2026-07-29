# Planet textures

Four equirectangular maps for the Explore globe. Both sources are MIT, so the licence text below
travels with the files. Read 29 July 2026.

| File | Source | Licence |
|---|---|---|
| `earth-dark.jpg` | `https://unpkg.com/three-globe@2.31.0/example/img/earth-dark.jpg` | MIT, three-globe by Vasco Asturiano |
| `moon.jpg` | threex.planets example maps (`moonmap1k.jpg`) | MIT, threex.planets by Jerome Etienne |
| `mars.jpg` | threex.planets example maps (`marsmap1k.jpg`) | MIT, threex.planets by Jerome Etienne |
| `sun.jpg` | threex.planets example maps (`sunmap.jpg`) | MIT, threex.planets by Jerome Etienne |

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

A texture must stay equirectangular and must match the three.js `SphereGeometry` UV convention, so
`latLngToVector3` in `demo/src/kick/explore/geo.ts` puts latitude 90 at +Y. Replace a file only with
another equirectangular map.
