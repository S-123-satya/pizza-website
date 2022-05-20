import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
//Componnets
import HeaderNav from "./components/HeaderNav.js";
import FooterNav from "./components/FooterNav.js";
import MenuRoot from "./components/MenuRoot";
import RootSection from "./components/RootSection";
import ContactRoot from "./components/ContactRoot";
// import SushiRoot from "./components/SushiRoot";
// import SaleRoot from "./components/SaleRoot";
// import PastaRoot from "./components/PastaRoot";
// import DrinksRoot from "./components/DrinksRoot";
import AboutUs from "./components/AboutUs";
import Blog from "./components/Blog";
import Cart from "./components/Cart";
import PasswordRecovery from "./components/PasswordRecovery.js";
import Register from "./components/Register";
//Data
import { allProductsData } from "./data/AllProductsData.js";
import { AllCategories } from "./data/AllCategories";
export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      allCategories: [],
      activeCategory: "Menu",
      cartItems: [],
      allProducts: [],
    };
    this.getProductsByCategory = this.getProductsByCategory.bind(this);
    this.changeCategory = this.changeCategory.bind(this);
  }

  // GET DATA
  /*******************************************************/
  allCategoriesData = new Promise((resolve, reject) => {
    if (true) {
      resolve(AllCategories);
      return;
    }
    reject("error, check the code!");
  });
  allProductsData = new Promise((resolve, reject) => {
    if (true) {
      resolve(allProductsData);
      return;
    }
    reject("error, check the code!");
  });

  getCategories = async () => {
    try {
      const result = await this.allCategoriesData;
      this.setState({ allCategories: result });
    } catch (error) {
      console.log(error);
    }
  };

  getAllProducts = async () => {
    try {
      const result = await this.allProductsData;
      this.setState({ allProducts: result });
    } catch (error) {
      console.log(error);
    }
  };

  // HANDLE CHANGE
  /*******************************************************/
  changeCategory = async (newCategory) => {
    this.setState({ activeCategory: newCategory });
    this.getProductsByCategory(newCategory);
  };

  getProductsByCategory = async (category) => {
    let separateCategoriesByname = [];
    //Separate arrays by category names
    const separateCategories = allProductsData.reduce(function (
      singleCategory,
      singleItem
    ) {
      separateCategoriesByname = Object.keys(singleCategory);

      if (!singleCategory[singleItem.Category])
        singleCategory[singleItem.Category] = singleItem;
      else
        singleCategory[singleItem.Category] = Array.isArray(
          singleCategory[singleItem.Category]
        )
          ? singleCategory[singleItem.Category].concat(singleItem)
          : [singleCategory[singleItem.Category]].concat(singleItem);
      return singleCategory;
    },
    {});

    const result = Object.keys(separateCategories).map(
      (e) => separateCategories[e]
    );

    let singleCategoryArray = [];
    result.map((categories) => {
      singleCategoryArray = categories;
    });
    //Change products by category
    separateCategoriesByname.forEach((cate) => {
      if (cate === category) {
        this.setState({ allProducts: separateCategories[category] });
      }
      if (category === "Menu") {
        this.setState({ allProducts: allProductsData });
      }
    });
  };

  CheckRepeatableProducts = (
    cartItems,
    targetProduct,
    userSelectedAttributes
  ) => {
    let item;
    let productsById = cartItems.filter((item) => item.id === targetProduct.id);
    productsById.forEach((targetProduct) => {
      if (this.MatchingAttributes(userSelectedAttributes, targetProduct)) {
        item = targetProduct;
      }
    });
    return item;
  };
  updateCartQuantity(
    actionToPerfrom,
    productAlreadyInCart,
    userSelectedAttributes
  ) {
    const repeatableProduct = this.CheckRepeatableProducts(
      this.state.cartItems,
      productAlreadyInCart,
      userSelectedAttributes
    );
    //Find the target product to update by index
    const indexOfRepeatableProduct =
      this.state.cartItems.indexOf(repeatableProduct);
    const currentProductList = [...this.state.cartItems];
    //Check type of action
    if (actionToPerfrom === "addProduct") {
      currentProductList[indexOfRepeatableProduct].quantity += 1;
    } else {
      currentProductList[indexOfRepeatableProduct].quantity -= 1;
    }

    return currentProductList;
  }
  handleAddProduct = (targetProduct, userSelectedAttributes) => {
    let updatedProductList;
    const productAlreadyInCart = this.CheckRepeatableProducts(
      this.state.cartItems,
      targetProduct,
      userSelectedAttributes
    );

    if (productAlreadyInCart) {
      updatedProductList = this.updateCartQuantity(
        "addProduct",
        productAlreadyInCart,
        userSelectedAttributes
      );
    } else {
      let modifiedProduct = JSON.parse(JSON.stringify(targetProduct));
      let clone;

      for (let i = 0; i < targetProduct?.attributes?.length; i++) {
        for (let j = 0; j < targetProduct?.attributes[i]?.items?.length; j++) {
          if (
            targetProduct.attributes[i].items[j].value ===
            userSelectedAttributes[i].value
          ) {
            clone = {
              ...targetProduct.attributes[i].items[j],
            };
            clone.isSelected = true;

            modifiedProduct.attributes[i].items[j].isSelected = true;

            modifiedProduct.attributes[i].items[j] = {
              ...clone,
            };
          }
        }
      }

      updatedProductList = [
        ...this.state.cartItems,
        {
          ...modifiedProduct,
          userSelectedAttributes,
          quantity: 1,
        },
      ];
    }
    this.setState({ cartItems: updatedProductList });
    //save to local storage
    localStorage.setItem("cartItems", JSON.stringify(updatedProductList));
    //Update cart amount
    if (updatedProductList.length <= 1) {
      updatedProductList.map((item) => {
        //save to local storage
        localStorage.setItem("productsQuantity", JSON.stringify(item.quantity));
        return this.setState({ productsQuantity: item.quantity });
      });
    } else {
      let productListArray = updatedProductList.map((item) => item.quantity);
      let sum = productListArray.reduce((a, b) => a + b, 0);
      this.setState({ productsQuantity: sum });
      //save to local storage
      localStorage.setItem("productsQuantity", JSON.stringify(sum));
    }
  };
  // Remove Product From Cart
  handleRemoveProduct = (targetProduct, userSelectedAttributes) => {
    let updatedProductList;
    let repeatableProduct = this.CheckRepeatableProducts(
      this.state.cartItems,
      targetProduct,
      userSelectedAttributes
    );
    if (repeatableProduct.quantity > 1) {
      updatedProductList = this.updateCartQuantity(
        "removeProduct",
        repeatableProduct,
        userSelectedAttributes
      );
    } else {
      const products = [...this.state.cartItems];
      const indexOfProduct = products.indexOf(repeatableProduct);
      products.splice(indexOfProduct, 1);
      updatedProductList = products;
    }
    this.setState({ cartItems: updatedProductList });
    //save to local storage
    localStorage.setItem("cartItems", JSON.stringify(updatedProductList));

    //Update cart amount
    if (updatedProductList.length <= 1) {
      updatedProductList.map((item) => {
        //save to local storage
        localStorage.setItem("productsQuantity", JSON.stringify(item.quantity));

        return this.setState({ productsQuantity: item.quantity });
      });
    } else {
      let productListArray = updatedProductList.map((item) => item.quantity);
      let sum = productListArray.reduce((a, b) => a + b);
      this.setState({ productsQuantity: sum });
      //save to local storage
      localStorage.setItem("productsQuantity", JSON.stringify(sum));
    }
    if (updatedProductList.length === 0) {
      this.setState({ productsQuantity: 0 });
      //save to local storage
      localStorage.setItem("productsQuantity", JSON.stringify(0));
    }
  };
  componentDidMount() {
    this.getCategories();
    this.getAllProducts();
    this.getProductsByCategory(this.state.activeCategory);
  }
  render() {
    // console.log(this.state.cartItems);
    return (
      <BrowserRouter>
        <HeaderNav />
        <Routes>
          <Route path="/pizza-time-with-react" element={<RootSection />} />
          <Route
            path="/menu"
            element={
              <MenuRoot
                allProducts={this.state.allProducts}
                allCategories={this.state.allCategories}
                activeCategory={this.state.activeCategory}
                changeCategory={this.changeCategory}
              />
            }
          />
          {/* <Route path="/pizza" element={<MenuRoot />} /> */}
          <Route path="/contact" element={<ContactRoot />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/about" element={<AboutUs />} />
          {/* <Route path="/sushi" element={<SushiRoot />} />
          <Route path="/sale" element={<SaleRoot />} />
          <Route path="/pasta" element={<PastaRoot />} />
          <Route path="/drinks" element={<DrinksRoot />} /> */}
          <Route path="/register" element={<Register />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
        </Routes>
        <FooterNav />
      </BrowserRouter>
    );
  }
}
