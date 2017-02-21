/*
  TODO: delete this comment

  This file is where you bootstrap your JS code
  For example import stuff here:

  import {select} from 'd3-selection';
  import myComponent from './components/my-component';

  Split logical parts of you project into components e.g.

  /client
    - /components
        - /component-name
            - styles.scss
            - index.js
            - template.html

*/
// Origami, Y U NO NPM!?!?!?!
import * as expander from 'o-expander'; // eslint-disable-line
expander.init(null, {
  expandedToggleText: 'Show fewer polls',
  collapsedToggleText: 'Show more polls',
});
