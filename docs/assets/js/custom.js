const HTMLStringToElement = (stringElement) => {
    var template = document.createElement('template');
    stringElement = stringElement.trim();
    template.innerHTML = stringElement;
    return template.content.firstChild;
}
