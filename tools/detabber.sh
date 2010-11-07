if [ $# -ne 2 ]
then
  echo 'FORMAT: detabber [directory] [replacement]'
  exit 1
elif [ ! -d $1 ]
then
  echo "ERROR: $1 is not a directory"
  exit 1
fi



files=$(find $1/* | grep -v "svn" | grep -v "DS_Store")
for afile in $files
do
  if [ -f $afile ]
  then
    sed  -i .bak "s/	/$2/g" $afile
  fi
done
