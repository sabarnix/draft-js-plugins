import React, { Component } from 'react';

// eslint-disable-next-line import/no-unresolved
import simpleExampleCode from '!!../../../loaders/prism-loader?language=javascript!./SimpleFormulaEditor';
// eslint-disable-next-line import/no-unresolved
import simpleExampleEditorStylesCode from '!!../../../loaders/prism-loader?language=css!./SimpleFormulaEditor/editorStyles.css';
// eslint-disable-next-line import/no-unresolved
import webpackConfig from '!!../../../loaders/prism-loader?language=javascript!./webpackConfig';
// eslint-disable-next-line import/no-unresolved
import webpackImport from '!!../../../loaders/prism-loader?language=javascript!./webpackImport';

import Container from '../../shared/Container';
import AlternateContainer from '../../shared/AlternateContainer';
import Heading from '../../shared/Heading';
import styles from './styles.css';
import Code from '../../shared/Code';
import SimpleFormulaEditor from './SimpleFormulaEditor';
import SocialBar from '../../shared/SocialBar';
import NavBar from '../../shared/NavBar';
import Separator from '../../shared/Separator';
import ExternalLink from '../../shared/Link';
import InlineCode from '../../shared/InlineCode';

export default class App extends Component {
  render() {
    return (
      <div>
        <NavBar />
        <Separator />
        <Container>
          <Heading level={2}>Formula</Heading>
        </Container>
        <Container>
          <Heading level={2}>Simple Example</Heading>
          <SimpleFormulaEditor />          
        </Container>
        <SocialBar />
      </div>
    );
  }
}
