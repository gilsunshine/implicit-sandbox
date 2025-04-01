import {createTheme} from 'thememirror';
import {tags as t} from '@lezer/highlight';

// Author: Gil Sunshine
const fieldsTheme = createTheme({
	variant: 'dark',
	settings: {
		background: '#191919',
		foreground: '#cdff70',
		caret: 'rgb(217, 255, 0)',
		selection: 'rgb(164, 139, 255)',
		lineHighlight: '#353535',
		gutterBackground: '#000000',
		gutterForeground: '#8c8c8c',
	},
	styles: [
		{
			tag: t.comment,
			color: '#AEAEAE',
		},
		{
			tag: [t.string, t.special(t.brace), t.regexp],
			color: '#8DFF8E',
		},
		{
			tag: [
				t.className,
				t.definition(t.propertyName),
				t.function(t.variableName),
				t.function(t.definition(t.variableName)),
				t.definition(t.typeName),
			],
			color: '#A3EBFF',
		},
		{
			tag: [t.number, t.bool, t.null],
			color: '#52a8ff',
		},
		{
			tag: [t.keyword, t.operator],
			color: '#2cd1f2',
		},
		{
			tag: [t.definitionKeyword, t.modifier],
			color: 'rgb(217, 255, 0)',
		},
		{
			tag: [t.variableName, t.self],
			color: '#ec74dc',
		},
		{
			tag: [t.angleBracket, t.tagName, t.typeName, t.propertyName],
			color: 'rgb(0, 255, 221)',
		},
		{
			tag: t.derefOperator,
			color: 'rgb(217, 255, 0)',
		},
		{
			tag: t.attributeName,
			color:'rgb(217, 255, 0)',
		},
	],
});

export default fieldsTheme