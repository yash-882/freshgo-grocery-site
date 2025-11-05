const normalizeLabel = (label) => {
    return label
    ?.split('_')
    .join(' ') // _ -> ' '
    .replace(/\band\b/g, '&') //and -> &
}
 
export default normalizeLabel;