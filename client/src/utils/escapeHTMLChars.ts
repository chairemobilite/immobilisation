
/**
 * Function to escape HTML characters with the correct string if 
 * it comes up
 * @param rawString the raw string you're being asked to show
 * @returns a string with the HTML characters transformed to the require code
 */
export function escapeHTMLChars(rawString:string|number|null):string{
    if (rawString === null) return '';
    if (typeof rawString==='number')return rawString.toString()
    return(
        rawString.replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',                                                            
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;' 
        }[c] as string))
    )
}