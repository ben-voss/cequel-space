sed 's/width=\"100%\"/width=\"16\"/' icon.svg | sed 's/height=\"100%\"/height=\"16\"/' > icon-16x16.svg
sed 's/width=\"100%\"/width=\"32\"/' icon.svg | sed 's/height=\"100%\"/height=\"32\"/' > icon-32x32.svg
sed 's/width=\"100%\"/width=\"64\"/' icon.svg | sed 's/height=\"100%\"/height=\"64\"/' > icon-64x64.svg
sed 's/width=\"100%\"/width=\"128\"/' icon.svg | sed 's/height=\"100%\"/height=\"128\"/' > icon-128x128.svg
sed 's/width=\"100%\"/width=\"256\"/' icon.svg | sed 's/height=\"100%\"/height=\"256\"/' > icon-256x256.svg
sed 's/width=\"100%\"/width=\"512\"/' icon.svg | sed 's/height=\"100%\"/height=\"512\"/' > icon-512x512.svg
sed 's/width=\"100%\"/width=\"1024\"/' icon.svg | sed 's/height=\"100%\"/height=\"1024\"/' > icon-1024x1024.svg

mkdir icon.iconset

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_16x16.png icon-16x16.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_16x16@2x.png -w 512 icon-32x32.svg

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_32x32.png -w 32 icon-32x32.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_32x32@2x.png -w 512 icon-64x64.svg

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_128x128.png -w 128 icon-128x128.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_128x128@2x.png -w 512 icon-256x256.svg

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_256x256.png -w 256 icon-256x256.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_256x256@2x.png -w 512 icon-512x512.svg

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_512x512.png -w 512 icon-512x512.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename icon.iconset/icon_512x512@2x.png -w 512 icon-1024x1024.svg

iconutil -c icns icon.iconset

rm icon-16x16.svg
rm icon-32x32.svg
rm icon-64x64.svg
rm icon-128x128.svg
rm icon-256x256.svg
rm icon-512x512.svg
rm icon-1024x1024.svg

rm -r icon.iconset


# Generate favicon
sed 's/viewBox=\"0 0 1024 1024\"/viewBox=\"80 80 864 864\"/' icon.svg > favicon.svg

sed 's/width=\"100%\"/width=\"192\"/' favicon.svg | sed 's/height=\"100%\"/height=\"192\"/' > icon-192x192.svg
sed 's/width=\"100%\"/width=\"512\"/' favicon.svg | sed 's/height=\"100%\"/height=\"512\"/' > icon-512x512.svg
sed 's/width=\"100%\"/width=\"180\"/' favicon.svg | sed 's/height=\"100%\"/height=\"180\"/' > icon-180x180.svg
sed 's/width=\"100%\"/width=\"16\"/' favicon.svg | sed 's/height=\"100%\"/height=\"16\"/' > icon-16x16.svg
sed 's/width=\"100%\"/width=\"32\"/' favicon.svg | sed 's/height=\"100%\"/height=\"32\"/' > icon-32x32.svg
sed 's/width=\"100%\"/width=\"48\"/' favicon.svg | sed 's/height=\"100%\"/height=\"48\"/' > icon-48x48.svg

mkdir favicon

/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/android-chrome-192x192.png -w 192 icon-192x192.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/android-chrome-512x512.png -w 512 icon-512x512.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/apple-touch-icon.png -w 180 icon-180x180.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/favicon-16x16.png -w 16 icon-16x16.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/favicon-32x32.png -w 32 icon-32x32.svg
/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename favicon/favicon-48x48.png -w 48 icon-48x48.svg
convert favicon/favicon-16x16.png favicon/favicon-32x32.png favicon/favicon-48x48.png favicon/favicon.ico

mv favicon/android-chrome-192x192.png ../public
mv favicon/android-chrome-512x512.png ../public
mv favicon/apple-touch-icon.png ../public
mv favicon/favicon-16x16.png ../public
mv favicon/favicon-32x32.png ../public
mv favicon/favicon.ico ../public

rm icon-16x16.svg
rm icon-32x32.svg
rm icon-48x48.svg
rm icon-180x180.svg
rm icon-192x192.svg
rm icon-512x512.svg
rm favicon.svg

rm -r favicon
