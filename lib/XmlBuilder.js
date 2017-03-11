"use strict";

const _ = require("lodash");

/**
 * XML document builder.
 * @private
 */
class XmlBuilder {
    /**
     * Build an XML string from the JSON object.
     * @param {{}} node - The node.
     * @returns {string} The XML text.
     */
    build(node) {
        this._i = 0;
        return this._build(node, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
    }

    /**
     * Build the XML string. (This is the internal recursive method.)
     * @param {{}} node - The node.
     * @param {string} xml - The initial XML doc string.
     * @returns {string} The generated XML element.
     * @private
     */
    _build(node, xml) {
        // For CPU performance, JS engines don't truly concatenate strings; they create a tree of pointers to
        // the various concatenated strings. The downside of this is that it consumes a lot of memory, which
        // will cause problems with large workbooks. So periodically, we grab a character from the xml, which
        // causes the JS engine to flatten the tree into a single string. Do this too often and CPU takes a hit.
        // Too frequently and memory takes a hit. Every 100k nodes seems to be a good balance.
        if (this._i++ % 100000 === 0) {
            this._c = xml[0];
        }

        if (_.isObject(node)) {
            // If the node is an object, then it maps to an element. Check if it has a name.
            if (!node.name) throw new Error("XML node does not have name");

            // Add the opening tag.
            xml += `<${node.name}`;

            // Add any node attributes
            _.forOwn(node.attributes, (value, name) => {
                xml += ` ${name}="${this._escapeString(value)}"`;
            });

            if (_.isEmpty(node.children)) {
                // Self-close the tag if no children.
                xml += "/>";
            } else {
                xml += ">";

                // Recursively add any children.
                _.forEach(node.children, child => {
                    xml = this._build(child, xml);
                });

                // Close the tag.
                xml += `</${node.name}>`;
            }
        } else {
            // It not an object, this should be a text node. Just add it.
            xml += this._escapeString(node);
        }

        // Return the updated XML element.
        return xml;
    }

    /**
     * Escape a string for use in XML by replacing &, ", ', <, and >.
     * @param {*} value - The value to escape.
     * @returns {string} The escaped string.
     * @private
     */
    _escapeString(value) {
        if (_.isNil(value)) return value;
        value = value.toString()
            .replace(/&/g, "&amp;") // Escape '&' first as the other escapes add them.
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        return value;
    }
}

module.exports = XmlBuilder;