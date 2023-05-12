const api = (() => {
  const URL = 'http://localhost:3000';
  const getCart = async () => {
    const response = await fetch(URL + '/cart');
    const jsonData = await response.json();
    return jsonData;
  };

  const getInventory = async () => {
    // define your method to get inventory data
    const response = await fetch(URL + '/inventory');
    const jsonData = await response.json();
    for (let i = 0; i < jsonData.length; i++) {
      jsonData[i]['amount'] = 1;
    }
    return jsonData;
  };

  const addToCart = async (inventoryItem) => {
    // define your method to add an item to cart
    const response = await fetch(URL + '/cart', {
      method: 'POST',
      body: JSON.stringify(inventoryItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const jsonData = await response.json();
    return jsonData;
  };

  const updateCart = async (id, newAmount) => {
    // define your method to update an item in cart
    const response = await fetch(URL + '/cart/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ amount: newAmount }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const jsonData = await response.json();
    return jsonData;
  };

  const deleteFromCart = async (id) => {
    // define your method to delete an item in cart
    const response = await fetch(URL + '/cart/' + id, {
      method: 'DELETE',
    });

    const jsonData = await response.json();
    return jsonData;
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(
        data.map((item) => {
          deleteFromCart(item.id);
          location.reload();
        })
      )
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = api;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const checkoutBtnEl = document.querySelector('.checkout-btn');
  const inventoryEl = document.querySelector('.inventory-container ul');
  const cartEl = document.querySelector('.cart-container ul');

  const renderInventory = (inventory) => {
    let inventoryTemp = '';
    inventory.forEach((item) => {
      const content = item.content;
      const amount = item.amount;
      const liTemp = `<li item-id="${item.id}"><span>${content}</span> <button class="minus">-</button> <span>${amount}</span> <button class="plus">+</button>
            <button class="add-to-cart">add to cart</button></li>`;
      inventoryTemp += liTemp;
    });
    inventoryEl.innerHTML = inventoryTemp;
  };

  const renderCart = (cart) => {
    let cartTemp = '';
    cart.forEach((item) => {
      const content = item.content;
      const amount = item.amount;
      const liTemp = `<li class="cart-item" item-id="${item.id}"><span>${content} x ${amount}</span>
            <button class="delete">delete</button></li>`;
      cartTemp += liTemp;
    });
    cartEl.innerHTML = cartTemp;
  };

  return { checkoutBtnEl, inventoryEl, cartEl, renderInventory, renderCart };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      console.log(data);
      state.inventory = data;
    });

    model.getCart().then((data) => {
      console.log(data);
      state.cart = data;
    });
  };
  const handleUpdateAmount = () => {
    view.inventoryEl.addEventListener('click', (event) => {
      if (event.target.className !== 'minus') return;
      console.log('Clicked minus');
      const id = event.target.parentNode.getAttribute('item-id');
      const newInventory = [...state.inventory];
      console.log(newInventory);
      for (let i = 0; i < newInventory.length; i++) {
        if (+id === newInventory[i].id) {
          if (newInventory[i].amount > 0) {
            newInventory[i].amount--;
          }
          break;
        }
      }
      state.inventory = newInventory;
    });

    view.inventoryEl.addEventListener('click', (event) => {
      if (event.target.className !== 'plus') return;
      console.log('Clicked plus');
      const id = event.target.parentNode.getAttribute('item-id');
      const newInventory = [...state.inventory];
      for (let i = 0; i < newInventory.length; i++) {
        if (+id === newInventory[i].id) {
          newInventory[i].amount++;
          break;
        }
      }
      state.inventory = newInventory;
    });
  };

  const handleAddToCart = () => {
    view.inventoryEl.addEventListener('click', async (event) => {
      if (event.target.className !== 'add-to-cart') return;
      const id = event.target.parentNode.getAttribute('item-id');
      const newCart = [...state.cart];
      const inventoryItem = Object.assign(
        {},
        state.inventory.find((item) => item.id === +id)
      );
      const cartItem = state.cart.find((item) => item.id === +id);
      console.log(inventoryItem);
      if (cartItem) {
        await model.updateCart(+id, inventoryItem.amount + cartItem.amount);
      } else if (inventoryItem) {
        await model.addToCart(inventoryItem);
        newCart.push(inventoryItem);
        state.cart = newCart;
      }
      location.reload();
    });
  };

  const handleDelete = () => {
    view.cartEl.addEventListener('click', async (event) => {
      if (event.target.className !== 'delete') return;
      const id = event.target.parentNode.getAttribute('item-id');
      await model.deleteFromCart(+id);
      const newCart = state.cart.filter((item) => item['item-id'] !== +id);
      state.cart = newCart;
      location.reload();
    });
  };

  const handleCheckout = () => {
    view.checkoutBtnEl.addEventListener('click', (event) => {
      model.checkout();
    });
  };
  const bootstrap = () => {
    init();
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
