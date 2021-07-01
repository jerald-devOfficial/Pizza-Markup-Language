(function () {
  'use strict';

  class OrderSystem {
    constructor() {
      this.pizzaDetails = {
        sizes: ['small', 'medium', 'large'],
        crusts: ['thin', 'thick', 'hand-tossed', 'deep dish'],
        types: ['Hawaiian', 'Chicken Fajita', 'Pepperoni Feast', 'custom'],
        toppingAreas: {
          0: 'Whole',
          1: 'First-Half',
          2: 'Second-Half'
        },
        maxCustomToppingAreas: 3,
        maxCustomToppingItemsPerArea: 12
      };

      this.errorMessages = {
        invalidFormat: 'Invalid PML format',
        noOrder: 'There is no order.',
        oneOrderPerSubmission: 'Only one order per submission is allowed.',
        noOrderNumber: 'No order number.',
        pizzaNumberOrder: 'Incorrect order of pizzas.',
        noSize: 'Please indicate pizza size.',
        oneSizePerPizza: 'Only one size per pizza.',
        invalidSize: 'Pizza size must be small, medium, or large.',
        noCrust: 'Please indicate pizza crust.',
        oneCrustPerPizza: 'Only one crust type per pizza.',
        invalidCrust: 'Pizza crust must be thin, thick, hand-tossed, or deep dish.',
        noType: 'Please indicate pizza type.',
        oneTypePerPizza: 'Only one type per pizza.',
        invalidType: 'Pizza type must be Hawaiian, Chicken Fajita, Pepperoni Feast, or custom.',
        noToppingsAllowedForPizzaType: 'Selected pizza type cannot have custom toppings.',
        maxCustomToppingAreas: `Up to ${this.pizzaDetails.maxCustomToppingAreas} topping areas allowed.`,
        maxCustomToppingItemsPerArea: `Up to ${this.pizzaDetails.maxCustomToppingItemsPerArea} toppings per area allowed.`,
        invalidToppingArea:
          'Topping area must be 0 (whole pizza), 1 (first-half), or 2 (second-half).'
      };
    }

    getOrder(order, displayElement) {
      const validation = this.validate(order);
      displayElement.innerHTML = validation === 'valid' ? this.parseOrder(order) : validation;
    }

    validate(order) {
      const xml = this.convertToXml(order);

      if (xml.getElementsByTagName('parsererror').length) {
        return this.errorMessages.invalidFormat;
      }

      // check if order has number
      const orderTags = xml.getElementsByTagName('order');
      if (orderTags.length === 0) {
        return this.errorMessages.noOrder;
      }
      const newOrder = orderTags[0];
      if (!newOrder.hasAttribute('number') || newOrder.getAttribute('number').trim() === '') {
        return this.errorMessages.noOrderNumber;
      }

      const pizzas = newOrder.getElementsByTagName('pizza');
      for (let i = 0; i < pizzas.length; i++) {
        const pizza = pizzas[i];

        // check if pizza numbers are in order and starts at 1.
        if (parseInt(pizza.getAttribute('number')) !== i + 1) {
          return this.errorMessages.pizzaNumberOrder;
        }

        // check if size is small, medium, or large.
        const size = pizza.getElementsByTagName('size');
        if (size.length === 0) {
          return this.errorMessages.noSize;
        } else if (size.length > 1) {
          return this.errorMessages.oneSizePerPizza;
        }
        for (let j = 0; j < this.pizzaDetails.sizes.length; j++) {
          if (this.pizzaDetails.sizes[j].toLowerCase() === size[0].textContent.toLowerCase()) {
            break;
          }

          if (j === this.pizzaDetails.sizes.length - 1) {
            return this.errorMessages.invalidSize;
          }
        }

        // check if crust is thin, thick, hand-tossed, deep dish.
        const crust = pizza.getElementsByTagName('crust');
        if (crust.length === 0) {
          return this.errorMessages.noCrust;
        } else if (crust.length > 1) {
          return this.errorMessages.oneCrustPerPizza;
        }
        for (let j = 0; j < this.pizzaDetails.crusts.length; j++) {
          if (this.pizzaDetails.crusts[j].toLowerCase() === crust[0].textContent.toLowerCase()) {
            break;
          }

          if (j === this.pizzaDetails.crusts.length - 1) {
            return this.errorMessages.invalidCrust;
          }
        }

        // check if type is Hawaiian, Chicken Fajita, Pepperoni Feast, or custom.
        const pizzaType = pizza.getElementsByTagName('type');
        if (pizzaType.length === 0) {
          return this.errorMessages.noType;
        } else if (pizzaType.length > 1) {
          return this.errorMessages.oneTypePerPizza;
        }
        for (let j = 0; j < this.pizzaDetails.types.length; j++) {
          if (this.pizzaDetails.types[j].toLowerCase() === pizzaType[0].textContent.toLowerCase()) {
            break;
          }

          if (j === this.pizzaDetails.types.length - 1) {
            return this.errorMessages.invalidType;
          }
        }

        // check toppings.
        const toppingAreas = pizza.getElementsByTagName('toppings');
        if (pizzaType[0].textContent.toLowerCase() !== 'custom' && toppingAreas.length > 0) {
          return this.errorMessages.noToppingsAllowedForPizzaType;
        } else if (toppingAreas.length > this.pizzaDetails.maxCustomToppingAreas) {
          return this.errorMessages.maxCustomToppingAreas;
        }

        for (let j = 0; j < toppingAreas.length; j++) {
          const toppingArea = toppingAreas[j];

          // check if topping area is valid
          if (!(parseInt(toppingArea.getAttribute('area')) in this.pizzaDetails.toppingAreas)) {
            return this.errorMessages.invalidToppingArea;
          }

          const toppings = toppingArea.getElementsByTagName('item');
          if (toppings.length > this.pizzaDetails.maxCustomToppingItemsPerArea) {
            return this.errorMessages.maxCustomToppingItemsPerArea;
          }
        }
      }

      return 'valid';
    }

    parseOrder(pmlOrder) {
      const xml = this.convertToXml(pmlOrder);
      const order = xml.getElementsByTagName('order')[0];
      let parsedString = `<ul class="list-none mb-2.5">
        <li>Order ${order.getAttribute('number')}:`;

      let pizzas = order.getElementsByTagName('pizza');
      if (pizzas.length) {
        parsedString += `<ul class="list-none my-0 pl-10">`;
        for (let i = 0; i < pizzas.length; i++) {
          const pizza = pizzas[i];
          const size = pizza.getElementsByTagName('size')[0].textContent;
          const crust = pizza.getElementsByTagName('crust')[0].textContent;
          const pizzaType = pizza.getElementsByTagName('type')[0].textContent;
          parsedString += `<li class="mb-2">Pizza ${pizza.getAttribute(
            'number'
          )} - ${size}, ${crust}, ${pizzaType}`;

          if (pizzaType.toLowerCase() === 'custom') {
            const toppingAreas = pizza.getElementsByTagName('toppings');

            if (toppingAreas.length) {
              parsedString += `<ul class="list-none my-0 pl-10">`;
              for (let j = 0; j < toppingAreas.length; j++) {
                const toppingArea = toppingAreas[j];
                parsedString += `<li>Toppings ${
                  this.pizzaDetails.toppingAreas[toppingArea.getAttribute('area')]
                }:`;

                const toppings = toppingArea.getElementsByTagName('item');
                if (toppings.length) {
                  parsedString += `<ul class="list-none my-0 pl-10">`;
                  for (let k = 0; k < toppings.length; k++) {
                    parsedString += `<li>${toppings[k].textContent}</li>`;
                  }
                  parsedString += `</ul>`;
                }

                parsedString += `</li>`;
              }
              parsedString += `</ul>`;
            }
          }

          parsedString += `</li>`;
        }
        parsedString += `</ul>`;
      }

      parsedString += `</li>
        </ul>`;

      return parsedString;
    }

    convertToXml(order) {
      // convert tags to xml for easier parsing.
      order = order.replace(/{/g, '<').replace(/\\/g, '/').replace(/}/g, '>');

      const parser = new DOMParser();
      return parser.parseFromString(order, 'text/xml');
    }
  }

  const orderSystem = new OrderSystem();
  const txtOrder = document.getElementById('order');
  const btnOrder = document.getElementById('btn-order');
  const displayElement = document.getElementById('display');

  txtOrder.value = `{order number="123"}
    {pizza number="1"}
      {size}large{\\size}
      {crust}hand-tossed{\\crust}
      {type}custom{\\type}
      {toppings area="0"}
        {item}pepperoni{\\item}
        {item}extra cheese{\\item}
      {\\toppings}
      {toppings area="1"}
        {item}sausage{\\item}
      {\\toppings}
  {toppings area="2"}
        {item}mushrooms{\\item}
      {\\toppings}
    {\\pizza}
    {pizza number="2"}
      {size}medium{\\size}
  {crust}deep dish{\\crust}
      {type}pepperoni feast{\\type}
    {\\pizza}
  {\\order}`;

  btnOrder.addEventListener('click', () => {
    orderSystem.getOrder(txtOrder.value, displayElement);
  });
})();
