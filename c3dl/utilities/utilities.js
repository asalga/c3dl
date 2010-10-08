/*
  Copyright (c) 2008 Seneca College
  Licenced under the MIT License (http://www.c3dl.org/index.php/mit-license/)
*/

/**
 Check if the context, 'contextVersion' is supported.
 
 @param {float} contextVersion must be c3dl.GLES_CONTEXT_20
 
 @returns {boolean} True if the context 'contextVersion' is 
 supported or false if it's not supported or the 'contextVersion' 
 number was invalid.
 */
c3dl.isContextSupported = function (contextVersion)
{
  if (contextVersion !== c3dl.GLES_CONTEXT_20)
  {
    return false;
  }
  try
  { 
    // Minefield throws an exception if we couldn't grab a context.
    // Chrome returns null for getContext, so cover both cases.
    var cvs = document.createElement('canvas');
    
    if(!cvs.getContext("experimental-webgl")){
      return false;
    }
  }
  catch (err)
  {
    return false;
  }

  return true;
}

/**
 Create a copy of 'object' and return the copy.  This works with single
 dimensional Arrays and Objects.
 
 @param {Object|Array} object The object to copy.
 
 @returns {Object|Array} A copy of 'object'.
 */
c3dl.copyObj = function (object)
{
  if (object instanceof Array)
  {
    return object.slice();
  }
  else
  {
    var obj = new Object();

    for (i in object)
    {
      obj[i] = object[i];
    }

    return obj;
  }
}

/**
 Is the given path absolute or relative?
 
 @returns {boolean} true if the path is absolute false if relative
 */
c3dl.isPathAbsolute = function (path)
{
  var isAbsolute = false;

  for (var i = 0, len = path.length; i < len && i < 8; i++)
  {
    if (path.charAt(i) == ":")
    {
      isAbsolute = true;
    }
  }

  return isAbsolute;
}

/**
 Given a path to a file, this funciton will return the path without the
 filename.  If the following path was given,
 http://www.site.com/images/file.jpg
 this would be returned
 http://www.site.com/images/
 
 If the path is simply a filename, null will be returned.
 
 @returns {String} the path the user specified without the filename.
 */
c3dl.getPathWithoutFilename = function (path)
{
  var pathWithoutFilename = "";

  if (path != "")
  {
    // find the last slash either forward or backwards in the string.
    var lastForwardSlashPos = path.lastIndexOf('/');
    var lastBackSlashPos = path.lastIndexOf('\\');
    var lastSlashPos = lastForwardSlashPos > lastBackSlashPos ? lastForwardSlashPos : lastBackSlashPos;

    // copy chars from 0 to lastSlashPos
    for (var i = 0; i < lastSlashPos + 1; i++)
    {
      pathWithoutFilename += path[i];
    }
  }
  return pathWithoutFilename;
}

/**
 Get the absolute position of an object in the DOM.
 
 @returns {Array} an array with two elements, x and y.
 */
c3dl.getObjectPosition = function (obj)
{
  var currleft = 0;
  var currtop = 0;

  if (obj.offsetParent)
  {
    do
    {
      currleft += obj.offsetLeft;
      currtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return [currleft, currtop];
  }
}

/**
 @private
 */
c3dl.isValidColor = function (color)
{
  // Check if the value being passed is an array
  if (color instanceof Array)
  {
    // 4 color components: red, green, blue, alpha
    if (color.length == 4)
    {
      for (var i = 0; i < 4; i++)
      {
        // Check for Bad values
        if (isNaN(color[i])) return false;
      }
      return true;
    }
  }
  else
  {
    return false;
  }
}
