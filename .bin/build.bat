
echo "Call Cleaning..."
call .bin\clean.bat

echo "Call npminstall..."
call .bin\npminstall.bat

echo "---"
echo "Copia risorse..."
copy /Y "assets\*" "node_modules\primeng\resources\images\"

echo "Building..."
ng build

echo "Fine"

