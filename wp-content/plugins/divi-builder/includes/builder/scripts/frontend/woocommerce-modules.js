/* global wc_checkout_params */
/* global wc_cart_params */
/* global ETBuilderBackend */
/* global et_frontend_scripts */

// External dependencies
import {
  forEach,
  includes,
  replace,
} from 'lodash';

// Internal dependencies
import { isVB, isBuilder } from '../utils/utils';

(function($) {
  /* Begin: Woo Modules Checkout scripts */

  /**
   * Prevent Checkout JS scripts from being loaded on the page.
   *
   * Checkout JS should only be used when Builder is used. Stop loading otherwise.
   *
   * @since 4.14.0
   *
   * @returns {boolean}
   */
  function stopLoadingCheckoutJs() {
    return !$('body').hasClass('et_pb_pagebuilder_layout');
  }

  /**
   * Hides shipping errors when no shipping module is present.
   */
  function hideShippingErrorsWhenNoShippingModule() {
    const pageHasShippingModule = $('.et_pb_wc_checkout_shipping').length;
    if (! pageHasShippingModule) {
      $('.woocommerce-error li[data-id^="shipping_"]').hide();
    }
  }

  function hideCartTotals() {
    if (stopLoadingCheckoutJs()) {
      return;
    }

    $('.et_pb_wc_cart_totals').hide();
  }

  function removeEmptyRowPaddingInOrderReceivedPage() {
    if (stopLoadingCheckoutJs()) {
      return;
    }

    if (!$('body').hasClass('woocommerce-order-received')) {
      return;
    }

    $('.et_pb_row:has(".et_pb_column.et_pb_column_empty")').addClass('et_pb_no_top_bottom_padding');
  }

  function createAccountChangeHanlder(e) {
    const target = $(e.target);
    if (target.is(':checked')) {

      $('<input>').attr({
        type:  'hidden',
        value: target.val(),
        name:  'createaccount',
      }).prependTo('form.checkout');
    } else {
      $('input[type=hidden][name=createaccount]').remove();
    }
  }

  /**
   * Handles Order Notes textarea change event.
   *
   * @param {Object} e
   *
   * @return {void}
   */
  function textareaChangeHandler(e){
    const name       = e.target.getAttribute('name');
    const value      = e.target.value;
    const hiddenElem = $(`input[type=hidden][name=${name}]`);

    hiddenElem.remove();

    $('<input>').attr({
      type:  'hidden',
      value: value,
      name:  name,
    }).prependTo('form.checkout');
  }

  function selectChangeHanlder(e) {
    const name       = e.target.getAttribute('name');
    const value      = e.target.value;
    const hiddenElem = $(`input[type=hidden][name=${name}]`);

    hiddenElem.remove();

    if(includes(['shipping_state', 'billing_state'], name)) {
      $(`input[type=hidden][name=${name}]`, '.et_pb_wc_checkout_payment_info').remove();
    }

    $('<input>').attr({
      type:  'hidden',
      value: value,
      name:  name,
    }).prependTo('form.checkout');
  }

  function inputChangeHandler(e) {
    const target       = $(e.target);
    const name         = e.target.getAttribute('name');
    const value        = target.val();
    const hiddenTarget = $(`input[type=hidden][name=${name}]`);

    hiddenTarget.remove();

    $('<input>').attr({
      type:  'hidden',
      value: value,
      name:  name,
    }).prependTo('form.checkout');
  };

  function generateHiddenFieldsOnChange() {
    const checkoutFormElem           = $('form.checkout');
    const shipToDifferentAddressElem = $('.et_pb_wc_checkout_shipping input[name=ship_to_different_address]');
    const isShipToDifferentAddress   = shipToDifferentAddressElem.is(':checked');

    checkoutFormElem.on('change', 'input[type=text][name=billing_first_name]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_last_name]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_company]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_address_1]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_address_2]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_city]:visible', inputChangeHandler);
    checkoutFormElem.on('change', 'input[type=text][name=billing_postcode]:visible', inputChangeHandler);

    checkoutFormElem.on('change', 'input[type=tel][name=billing_phone]:visible', inputChangeHandler);

    checkoutFormElem.on('change', 'input[type=email][name=billing_email]:visible', inputChangeHandler);

    checkoutFormElem.on('change', 'select[name=billing_country]:visible', selectChangeHanlder);
    checkoutFormElem.on('change', 'select[name=billing_state]:visible', selectChangeHanlder);
    checkoutFormElem.on('change', 'input[type=text][name=billing_state]', inputChangeHandler);

    if (isShipToDifferentAddress) {
      checkoutFormElem.on('change', 'input[type=text][name=shipping_first_name]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_last_name]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_company]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_address_1]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_address_2]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_city]:visible', inputChangeHandler);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_postcode]:visible', inputChangeHandler);

      checkoutFormElem.on('change', 'select[name=shipping_country]', selectChangeHanlder);
      checkoutFormElem.on('change', 'select[name=shipping_state]', selectChangeHanlder);
      checkoutFormElem.on('change', 'input[type=text][name=shipping_state]', inputChangeHandler);
    }

    checkoutFormElem.on('change', 'input#createaccount:visible', createAccountChangeHanlder);

    $('textarea[name=order_comments]').on('change', textareaChangeHandler)
  }

  function generateHiddenFieldsOnLoad() {
    const billingFormInputFieldNames       = [
      'billing_first_name',
      'billing_last_name',
      'billing_company',
      'billing_address_1',
      'billing_address_2',
      'billing_city',
      'billing_postcode',
      'billing_phone',
      'billing_email',
    ];
    let shippingFormInputFieldNames        = [];
    const additionalInfoTextareaFieldNames = ['order_comments'];
    const shipToDifferentAddressElem       = $(
      '.et_pb_wc_checkout_shipping input[name=ship_to_different_address]');
    const isShipToDifferentAddress         = shipToDifferentAddressElem.is(':checked');
    const billingFormSelectFieldNames      = [
      'billing_country',
    ];
    const shippingFormSelectFieldNames     = [];

    if (isShipToDifferentAddress) {
      shippingFormInputFieldNames.push('shipping_first_name');
      shippingFormInputFieldNames.push('shipping_last_name');
      shippingFormInputFieldNames.push('shipping_company');
      shippingFormInputFieldNames.push('shipping_address_1');
      shippingFormInputFieldNames.push('shipping_address_2');
      shippingFormInputFieldNames.push('shipping_city');
      shippingFormInputFieldNames.push('shipping_postcode');
    }

    forEach(billingFormInputFieldNames, function(name) {
      const elemByName = $(`.et_pb_wc_checkout_billing input[name=${name}]:visible:not([type=hidden])`);
      const value      = elemByName.val();
      const hiddenElem = $(`input[type=hidden][name=${name}]`);

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('form.checkout');
    });

    forEach(shippingFormInputFieldNames, function(name) {
      const elemByName = $(`.et_pb_wc_checkout_shipping input[name=${name}]:not([type=hidden])`);
      const value      = elemByName.val();
      const hiddenElem = $(`input[type=hidden][name=${name}]`);

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('form.checkout');
    });

    if (isShipToDifferentAddress) {
      shippingFormSelectFieldNames.push('shipping_country');
    }

    forEach(billingFormSelectFieldNames, function(name) {
      const elemType   = $(`.et_pb_wc_checkout_billing input[name="${name}"]`).attr('type');
      const hiddenElem = $(`.et_pb_wc_checkout_payment_info input[type=hidden][name=${name}]`);
      let elemByName;
      let value;

      if ('hidden' === elemType) {
        elemByName = $(`.et_pb_wc_checkout_billing input[name="${name}"]`);
        value      = elemByName.val();
      } else {
        elemByName = $(`.et_pb_wc_checkout_billing select[name=${name}]:visible option:selected`);
        value      = elemByName.val();
      }

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('.et_pb_wc_checkout_payment_info form.checkout');
    });

    forEach(shippingFormSelectFieldNames, function(name) {
      const elemType   = $(`.et_pb_wc_checkout_shipping input[name="${name}"]`).attr('type');
      const hiddenElem = $(`.et_pb_wc_checkout_payment_info input[type=hidden][name=${name}]`);

      let elemByName;
      let value;

      if ('hidden' === elemType) {
        elemByName = $(`.et_pb_wc_checkout_shipping input[name="${name}"]`);
        if (!elemByName.length) {
          const swapName = replace(name, 'shipping_', 'billing_');
          elemByName     = $(`.et_pb_wc_checkout_billing input[name="${swapName}"]`);
        }
        value = elemByName.val();
      } else {
        elemByName = $(`.et_pb_wc_checkout_shipping select[name=${name}]:visible option:selected`);
        if (!elemByName.length) {
          const swapName = replace(name, 'shipping_', 'billing_');
          elemByName     = $(`.et_pb_wc_checkout_billing select[name=${swapName}]:visible option:selected`);
        }
        value = elemByName.val();
      }

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('.et_pb_wc_checkout_payment_info form.checkout');
    });

    const stateFields = [];
    stateFields.push('billing_state');
    if (isShipToDifferentAddress) {
      stateFields.push('shipping_state');
    }

    forEach(stateFields, name => {
      const elemParent = 'billing_state' === name ? 'et_pb_wc_checkout_billing' : 'et_pb_wc_checkout_shipping';
      const elemType   = $(`.${elemParent} input[name="${name}"]`).attr('type');
      const hiddenElem = $(`.et_pb_wc_checkout_payment_info input[type=hidden][name=${name}]`);

      let elemByName;
      let value;

      if ('text' === elemType) {
        elemByName = $(`.${elemParent} input[name="${name}"]`);
        value = elemByName.val();
      } else {
        elemByName = $(`.${elemParent} select[name=${name}]:visible option:selected`);
        value = elemByName.val();
      }

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('.et_pb_wc_checkout_payment_info form.checkout');
    });

    forEach(additionalInfoTextareaFieldNames, function(name) {
      const elemByName = $('.et_pb_wc_checkout_additional_info').first().find(`textarea[name=${name}]`);
      const value      = elemByName.val();
      const hiddenElem = $(`input[type=hidden][name=${name}]`);

      // Remove existing hidden element with the same name to avoid repetition.
      hiddenElem.remove();

      $('<input>').attr({
        type: 'hidden',
        value: value,
        name: name,
      }).prependTo('form.checkout');
    });

    if (typeof wc_checkout_params !== 'undefined'
        && wc_checkout_params.option_guest_checkout
        && wc_checkout_params.option_guest_checkout === 'yes') {
      if ($('input#createaccount:visible').is(':checked')) {
        const value = $('input#createaccount:visible').val();

        $('<input>').attr({
          type: 'hidden',
          value: value,
          name: 'createaccount',
        }).prependTo('form.checkout');
      }
    } else {
      $('input[type=hidden][name=createaccount]').remove();
    }
  }

  function showOnlyOneNoticeGroup() {
    // Validation errors are displayed in all Checkout modules.
    // To avoid redundancy we hide all Notice groups except the first.
    $(document.body).on('checkout_error', function() {
      $('.woocommerce-NoticeGroup-checkout:not(:first)').hide();
    });
  }

  function initCheckoutScripts() {
    if (stopLoadingCheckoutJs()) {
      return;
    }

    showOnlyOneNoticeGroup();
    generateHiddenFieldsOnLoad();
    generateHiddenFieldsOnChange();
    hideShippingErrorsWhenNoShippingModule();
  }

  /* End: Woo Modules Checkout scripts */

  let checkoutBillingTimeoutId;

  /**
   * Add Checkout Billing Form Notice.
   *
   * So styling the Notice becomes easier in VB.
   *
   * @since 4.14.0
   */
  function addCheckoutBillingFormNotice() {
    const hasCheckoutBilling = $('.et_pb_wc_checkout_billing form.checkout').length;

    if (! hasCheckoutBilling) {
      checkoutBillingTimeoutId = setTimeout(addCheckoutBillingFormNotice, 1000);
    } else {
      if (isVB) {
        $('.et_pb_wc_checkout_billing form.checkout').prepend(`
        <div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">
          <ul class="woocommerce-error" role="alert">
            <li data-id="billing_first_name">
              <strong>Billing First name</strong> is a required field.
            </li>
          </ul>
        </div>
        `);
      }
      clearTimeout(checkoutBillingTimeoutId);
    }
  }

  /**
   * Adds class to the parent element of the checked payment radio element.
   *
   * This class name is used for styling.
   *
   * @since 4.14.0
   */
  function addParentClassOnCheckedPaymentRadio() {
    const wooCheckoutPaymentModules = $('.et_pb_wc_checkout_payment_info');

    // Remove existing class if any.
    $('.wc_payment_method').removeClass('et_pb_checked');

    wooCheckoutPaymentModules
      .find('input.input-radio[type="radio"]:checked')
      .parent('.wc_payment_method')
      .addClass('et_pb_checked');
  }

  const wooCartPage = {
    /**
     * Init custom button Icon.
     *
     * @since 4.14.0
     */
    customButtonIconInit: function() {
      window.et_pb_init_woo_custom_button_icon();
    },

    animationInit: function() {
      wooHelper.etProcessAnimationData();
    },

    /**
     * Makes the `Return To Shop` visible on Cart page (built using Divi) when emptied.
     *
     * Adds the animation complete class to `Return to Shop` button.
     *
     * @since 4.14.0
     */
    makeReturnToShopBtnVisibleWhenCartEmptied: function() {
      if (isVB) {
        return;
      }

      const cartNoticeElem = $('.wc-backward').closest('.et_pb_wc_cart_notice');
      const isAnimated     = cartNoticeElem.hasClass('et_animated');

      if (!isAnimated) {
        return;
      }

      cartNoticeElem.removeClass('et_animated').addClass('et_had_animation');
    },

    /**
     * Removes the duplicated Woo Cart Products form on FE.
     *
     * This issue doesn't occur in VB.
     *
     * @since 4.14.0
     */
    removeDuplicateWooCartForm: function() {
      if (isVB) {
        return;
      }

      $('.woocommerce-cart-form')
          .closest('.woocommerce')
          .find('.woocommerce-cart-form:not(:first)').remove();
    },

    removeDuplicatedCartTotalModules: function() {
      if (isVB) {
        return;
      }

      $('.et_pb_wc_cart_totals')
          .find('.cart_totals:not(:first)').remove();
    },

    wooCartTotalsInit: function() {

      // FE only.
      $(document.body).on('updated_wc_div', this.removeDuplicatedCartTotalModules);
    },

    /**
     * Init Woo Cart Products scripts.
     */
    wooCartProductsInit: function() {
      // FE only.
      $(document.body).on('updated_wc_div', this.removeDuplicateWooCartForm);
    },

    /**
     * Init Woo Notice scripts.
     */
    wooNoticeInit: function() {

      // FE only.
      $(document.body).on('updated_wc_div', this.makeReturnToShopBtnVisibleWhenCartEmptied);
      $(document.body).on('updated_wc_div', this.animationInit);
    },

    /**
     * Re-init button icons after CART AJAX (Add/remove products)
     *
     * @since 4.14.0
     */
    reInitCustomButtonIcon: function() {
      // window.et_pb_init_woo_custom_button_icon cannot be invoked directly.
      $(document.body).on('updated_wc_div', this.customButtonIconInit);
    },

    init: function() {
      // Scripts related to Woo Cart Products module.
      this.wooCartProductsInit();

      // Scripts related to Woo Notice module.
      this.wooNoticeInit();

      // After Cart AJAX, re-init custom button icon JS for icons to work.
      this.reInitCustomButtonIcon();

      this.wooCartTotalsInit();

      $(document.body).on(
          'change input',
          '.woocommerce-cart-form .cart_item :input',
          function() {

            if (isBuilder) {
              return;
            }

            let $buttonEl         = $(this).closest('.et_pb_module_inner').find(`button[name="update_cart"]`);
            const buttonClassName = 'et_pb_custom_button_icon et_pb_button';
            let buttonIcon;
            let buttonIconTablet;
            let buttonIconPhone;

            const $thisModule = $(this).parents('.et_pb_woo_custom_button_icon.et_pb_wc_cart_products');
            buttonIcon        = $thisModule.attr('data-apply_coupon-icon');
            buttonIconTablet  = $thisModule.attr('data-apply_coupon-icon-tablet');
            buttonIconPhone   = $thisModule.attr('data-apply_coupon-icon-phone');

            $buttonEl.addClass(buttonClassName);

            if (buttonIcon || buttonIconTablet || buttonIconPhone) {
              $buttonEl.attr('data-icon', buttonIcon);
              $buttonEl.attr('data-icon-tablet', buttonIconTablet);
              $buttonEl.attr('data-icon-phone', buttonIconPhone);
            }

          }
      );
    },
  };

  const wooCheckoutPage = {
    init: function() {
      this.stopStickyWooNoticeScroll();
    },

    stopStickyWooNoticeScroll: function() {
      if (isVB) {
        return;
      }

      $('a.showcoupon').on('click', function(e) {

        // Stop propagation only on Sticky Woo Notice modules and NOT otherwise.
        const isSticky = $(this)
            .parents('.et_pb_wc_cart_notice')
            .hasClass('et_pb_sticky_module');

        if (!isSticky) {
          return;
        }

        e.stopPropagation();

        const scope = $(this).parents('.et_pb_sticky_module');

        $('.checkout_coupon', scope).slideToggle(400, function() {
          $('.checkout_coupon', scope).find(':input:eq(0)').focus();
        });

        return false;
      });
    },
  };

  const wooHelper = {

    et_get_animation_classes: function() {
      return [
        'et_animated',
        'et_is_animating',
        'infinite',
        'et-waypoint',
        'fade',
        'fadeTop',
        'fadeRight',
        'fadeBottom',
        'fadeLeft',
        'slide',
        'slideTop',
        'slideRight',
        'slideBottom',
        'slideLeft',
        'bounce',
        'bounceTop',
        'bounceRight',
        'bounceBottom',
        'bounceLeft',
        'zoom',
        'zoomTop',
        'zoomRight',
        'zoomBottom',
        'zoomLeft',
        'flip',
        'flipTop',
        'flipRight',
        'flipBottom',
        'flipLeft',
        'fold',
        'foldTop',
        'foldRight',
        'foldBottom',
        'foldLeft',
        'roll',
        'rollTop',
        'rollRight',
        'rollBottom',
        'rollLeft',
        'transformAnim',
      ];
    },

    et_remove_animation: function($element) {
      // Don't remove looping animations, return early.
      if ($element.hasClass('infinite')) {
        return;
      }

      const animation_classes = this.et_get_animation_classes();

      // Remove attributes which avoid horizontal scroll to appear when section is rolled
      if ($element.is('.et_pb_section') && $element.is('.roll')) {
        $(`${et_frontend_scripts.builderCssContainerPrefix}, ${et_frontend_scripts.builderCssLayoutPrefix}`).css('overflow-x', '');
      }

      $element.removeClass(animation_classes.join(' '));
      $element.css({
        'animation-delay': '',
        'animation-duration': '',
        'animation-timing-function': '',
        opacity: '',
        transform: '',
        left: '',
      });

      // Prevent animation module with no explicit position property to be incorrectly positioned
      // after animation is clomplete and animation classname is removed because animation classname has
      // animation-name property which gives pseudo correct z-index. This class also works as a marker to prevent animating already animated objects.
      $element.addClass('et_had_animation');
    },

    et_remove_animation_data: function($element) {
      let attr_name;
      const data_attrs_to_remove = [];
      const data_attrs           = $element.get(0).attributes;

      for (let i = 0; i < data_attrs.length; i++) {
        if ('data-animation-' === data_attrs[i].name.substring(0, 15)) {
          data_attrs_to_remove.push(data_attrs[i].name);
        }
      }

      $.each(data_attrs_to_remove, (index, attr_name) => {
        $element.removeAttr(attr_name);
      });
    },

    et_process_animation_intensity: function(animation, direction, intensity) {
      let intensity_css = {};

      switch (animation) {
        case 'slide':
          switch (direction) {
            case 'top':
              var percentage = intensity * - 2;

              intensity_css = {
                transform: `translate3d(0, ${percentage}%, 0)`,
              };

              break;

            case 'right':
              var percentage = intensity * 2;

              intensity_css = {
                transform: `translate3d(${percentage}%, 0, 0)`,
              };

              break;

            case 'bottom':
              var percentage = intensity * 2;

              intensity_css = {
                transform: `translate3d(0, ${percentage}%, 0)`,
              };

              break;

            case 'left':
              var percentage = intensity * - 2;

              intensity_css = {
                transform: `translate3d(${percentage}%, 0, 0)`,
              };

              break;

            default:
              var scale = (100 - intensity) * 0.01;

              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };
              break;
          }
          break;

        case 'zoom':
          var scale = (100 - intensity) * 0.01;

          switch (direction) {
            case 'top':
              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };

              break;

            case 'right':
              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };

              break;

            case 'bottom':
              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };

              break;

            case 'left':
              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };

              break;

            default:
              intensity_css = {
                transform: `scale3d(${scale}, ${scale}, ${scale})`,
              };
              break;
          }

          break;

        case 'flip':
          switch (direction) {
            case 'right':
              var degree = Math.ceil((90 / 100) * intensity);

              intensity_css = {
                transform: `perspective(2000px) rotateY(${degree}deg)`,
              };
              break;

            case 'left':
              var degree = Math.ceil((90 / 100) * intensity) * - 1;

              intensity_css = {
                transform: `perspective(2000px) rotateY(${degree}deg)`,
              };
              break;

            case 'top':
            default:
              var degree = Math.ceil((90 / 100) * intensity);

              intensity_css = {
                transform: `perspective(2000px) rotateX(${degree}deg)`,
              };
              break;

            case 'bottom':
              var degree = Math.ceil((90 / 100) * intensity) * - 1;

              intensity_css = {
                transform: `perspective(2000px) rotateX(${degree}deg)`,
              };
              break;
          }

          break;

        case 'fold':
          switch (direction) {
            case 'top':
              var degree = Math.ceil((90 / 100) * intensity) * - 1;

              intensity_css = {
                transform: `perspective(2000px) rotateX(${degree}deg)`,
              };

              break;
            case 'bottom':
              var degree = Math.ceil((90 / 100) * intensity);

              intensity_css = {
                transform: `perspective(2000px) rotateX(${degree}deg)`,
              };

              break;

            case 'left':
              var degree = Math.ceil((90 / 100) * intensity);

              intensity_css = {
                transform: `perspective(2000px) rotateY(${degree}deg)`,
              };

              break;
            case 'right':
            default:
              var degree = Math.ceil((90 / 100) * intensity) * - 1;

              intensity_css = {
                transform: `perspective(2000px) rotateY(${degree}deg)`,
              };

              break;
          }

          break;

        case 'roll':
          switch (direction) {
            case 'right':
            case 'bottom':
              var degree = Math.ceil((360 / 100) * intensity) * - 1;

              intensity_css = {
                transform: `rotateZ(${degree}deg)`,
              };

              break;
            case 'top':
            case 'left':
              var degree = Math.ceil((360 / 100) * intensity);

              intensity_css = {
                transform: `rotateZ(${degree}deg)`,
              };

              break;
            default:
              var degree = Math.ceil((360 / 100) * intensity);

              intensity_css = {
                transform: `rotateZ(${degree}deg)`,
              };

              break;
          }

          break;
      }

      return intensity_css;
    },

    et_animate_element: function($elementOriginal) {
      let $element = $elementOriginal;
      if ($element.hasClass('et_had_animation')) {
        return;
      }

      const animation_style            = $element.attr('data-animation-style');
      const animation_repeat           = $element.attr('data-animation-repeat');
      const animation_duration         = $element.attr('data-animation-duration');
      const animation_delay            = $element.attr('data-animation-delay');
      const animation_intensity        = $element.attr('data-animation-intensity');
      const animation_starting_opacity = $element.attr('data-animation-starting-opacity');
      let animation_speed_curve        = $element.attr('data-animation-speed-curve');
      const $buttonWrapper             = $element.parent('.et_pb_button_module_wrapper');
      const isEdge                     = $('body').hasClass('edge');

      // Avoid horizontal scroll bar when section is rolled
      if ($element.is('.et_pb_section') && 'roll' === animation_style) {
        $(`${et_frontend_scripts.builderCssContainerPrefix}, ${et_frontend_scripts.builderCssLayoutPrefix}`).css('overflow-x', 'hidden');
      }

      // Remove all the animation data attributes once the variables have been set
      this.et_remove_animation_data($element);

      // Opacity can be 0 to 1 so the starting opacity is equal to the percentage number multiplied by 0.01
      const starting_opacity = isNaN(parseInt(animation_starting_opacity)) ? 0 : parseInt(animation_starting_opacity) * 0.01;

      // Check if the animation speed curve is one of the allowed ones and set it to the default one if it is not
      if (-1 === $.inArray(animation_speed_curve, ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'])) {
        animation_speed_curve = 'ease-in-out';
      }

      if ($buttonWrapper.length > 0) {
        $element.removeClass('et_animated');
        $element = $buttonWrapper;
        $element.addClass('et_animated');
      }

      $element.css({
        'animation-duration': animation_duration,
        'animation-delay': animation_delay,
        opacity: starting_opacity,
        'animation-timing-function': animation_speed_curve,
      });

      if ('slideTop' === animation_style || 'slideBottom' === animation_style) {
        $element.css('left', '0px');
      }

      let intensity_css          = {};
      const intensity_percentage = isNaN(parseInt(animation_intensity)) ? 50 : parseInt(animation_intensity);

      // All the animations that can have intensity
      const intensity_animations = ['slide', 'zoom', 'flip', 'fold', 'roll'];

      let original_animation = false;
      let original_direction = false;

      // Check if current animation can have intensity
      for (let i = 0; i < intensity_animations.length; i++) {
        const animation = intensity_animations[i];

        // As the animation style is a combination of type and direction check if
        // the current animation contains any of the allowed animation types
        if (!animation_style || animation_style.substr(0, animation.length) !== animation) {
          continue;
        }

        // If it does set the original animation to the base animation type
        original_animation = animation;

        // Get the remainder of the animation style and set it as the direction
        original_direction = animation_style.substr(animation.length, animation_style.length);

        // If that is not empty convert it to lower case for better readability's sake
        if ('' !== original_direction) {
          original_direction = original_direction.toLowerCase();
        }

        break;
      }

      if (original_animation !== false && original_direction !== false) {
        intensity_css = this.et_process_animation_intensity(original_animation, original_direction, intensity_percentage);
      }

      if (!$.isEmptyObject(intensity_css)) {
        // temporarily disable transform transitions to avoid double animation.
        $element.css(isEdge ? $.extend(intensity_css, {transition: 'transform 0s ease-in'}) : intensity_css);
      }

      $element.addClass('et_animated');
      $element.addClass('et_is_animating');
      $element.addClass(animation_style);
      $element.addClass(animation_repeat);

      // Remove the animation after it completes if it is not an infinite one
      if (!animation_repeat) {
        const animation_duration_ms = parseInt(animation_duration);
        const animation_delay_ms    = parseInt(animation_delay);
        setTimeout(() => {
          this.et_remove_animation($element);
        }, animation_duration_ms + animation_delay_ms);

        if (isEdge && !$.isEmptyObject(intensity_css)) {
          // re-enable transform transitions after animation is done.
          setTimeout(() => {
            $element.css('transition', '');
          }, animation_duration_ms + animation_delay_ms + 50);
        }
      }
    },

    getCurrentWindowMode: function() {
      const $etWindow   = $(window);
      const windowWidth = $etWindow.width();
      let currentMode   = 'desktop';

      if (windowWidth <= 980 && windowWidth > 767) {
        currentMode = 'tablet';
      } else if (windowWidth <= 767) {
        currentMode = 'phone';
      }

      return currentMode;
    },

    etProcessAnimationData: function(waypoints_enabled = false) {
      if ('undefined' === typeof et_animation_data || 0 === et_animation_data.length) {
        return;
      }

      $('body').css('overflow-x', 'hidden');
      $('#page-container').css('overflow-y', 'hidden');

      for (let i = 0; i < et_animation_data.length; i++) {
        const animation_entry = et_animation_data[i];

        if (
            !animation_entry.class
            || !animation_entry.style
            || !animation_entry.repeat
            || !animation_entry.duration
            || !animation_entry.delay
            || !animation_entry.intensity
            || !animation_entry.starting_opacity
            || !animation_entry.speed_curve
        ) {
          continue;
        }

        const $animated = $(`.${animation_entry.class}`);

        $animated.removeClass('et_had_animation');

        // Get current active device.
        const current_mode    = this.getCurrentWindowMode();
        const is_desktop_view = 'desktop' === current_mode;

        // Update animation breakpoint variable.
        let etAnimationBreakpoint = current_mode;

        // Generate suffix.
        let suffix = '';
        if (!is_desktop_view) {
          suffix += `_${current_mode}`;
        }

        // Being save and prepare the value.
        const data_style            = !is_desktop_view && typeof animation_entry[`style${suffix}`] !== 'undefined' ? animation_entry[`style${suffix}`] : animation_entry.style;
        const data_repeat           = !is_desktop_view && typeof animation_entry[`repeat${suffix}`] !== 'undefined' ? animation_entry[`repeat${suffix}`] : animation_entry.repeat;
        const data_duration         = !is_desktop_view && typeof animation_entry[`duration${suffix}`] !== 'undefined' ? animation_entry[`duration${suffix}`] : animation_entry.duration;
        const data_delay            = !is_desktop_view && typeof animation_entry[`delay${suffix}`] !== 'undefined' ? animation_entry[`delay${suffix}`] : animation_entry.delay;
        const data_intensity        = !is_desktop_view && typeof animation_entry[`intensity${suffix}`] !== 'undefined' ? animation_entry[`intensity${suffix}`] : animation_entry.intensity;
        const data_starting_opacity = !is_desktop_view && typeof animation_entry[`starting_opacity${suffix}`] !== 'undefined' ? animation_entry[`starting_opacity${suffix}`] : animation_entry.starting_opacity;
        const data_speed_curve      = !is_desktop_view && typeof animation_entry[`speed_curve${suffix}`] !== 'undefined' ? animation_entry[`speed_curve${suffix}`] : animation_entry.speed_curve;

        $animated.attr({
          'data-animation-style': data_style,
          'data-animation-repeat': 'once' === data_repeat ? '' : 'infinite',
          'data-animation-duration': data_duration,
          'data-animation-delay': data_delay,
          'data-animation-intensity': data_intensity,
          'data-animation-starting-opacity': data_starting_opacity,
          'data-animation-speed-curve': data_speed_curve,
        });

        // Process the waypoints logic if the waypoints are not ignored
        // Otherwise add the animation to the element right away
        this.et_animate_element($animated);
      }
    },
  };

  /**
   * Entry point for all scripts.
   */
  function init() {
    // Woo Cart page scripts init.
    wooCartPage.init();

    // Woo Checkout page scripts init.
    wooCheckoutPage.init();

    addCheckoutBillingFormNotice();

    /**
     * Adds the class to the parent element when a different radio is clicked in VB.
     *
     * @since 4.14.0
     */
    $(document.body).on('updated_checkout', addParentClassOnCheckedPaymentRadio);

    /**
     * Adds the class to the parent element when a different radio is clicked in FE.
     *
     * @since 4.14.0
     */
    $('#et-boc').on('change', 'input.input-radio', addParentClassOnCheckedPaymentRadio);

    /**
     * Stop firing AJAX on Remove product btn click in VB mode.
     *
     * @see https://github.com/elegantthemes/Divi/issues/22120
     */
    $(document.body).on('click', '.woocommerce-cart-form .product-remove > a', e => {
      if ('undefined' === typeof wc_cart_params) {
        return;
      }
      if (! isVB) {
        return;
      }

      e.preventDefault();

      // FALSE required to stop WooCommerce from firing AJAX.
      return false; /* eslint-disable-line consistent-return */
    });

    /**
     * Hook all Checkout scripts on `init_checkout` event.
     */
    $(document.body).on('init_checkout', initCheckoutScripts);

    /**
     * Creates hidden fields within the Form element that contains Place Order btn.
     *
     * The hidden fields are created only when the checkbox is checked.
     * i.e. When the customer wants to ship to a different address.
     */
    $(document.body).on('change', '#ship-to-different-address input', function() {
      if (stopLoadingCheckoutJs()) {
        return;
      }

      if(! $('#ship-to-different-address').parents('.et_pb_wc_checkout_shipping').length) {
        return;
      }

      var value                            = $(this).val();
      var name                             = $(this).attr('name');
      var hiddenShipToDifferentAddressElem = $(`input[type="hidden"][name=${name}]`);
      const shippingFormInputFieldNames    = [
        'shipping_first_name',
        'shipping_last_name',
        'shipping_company',
        'shipping_address_1',
        'shipping_address_2',
        'shipping_city',
        'shipping_postcode',
      ];
      const shippingFormSelectFieldNames    = [
        'shipping_country',
        'shipping_state',
      ];

      // Do nothing when "Ship to different address?" is not checked.
      if (!$(this).is(':checked')) {
        // Closest is must to only remove the hidden shipping fields.
        // Otherwise the visible shipping fields will be removed.
        const checkoutFormElem = $('button[name=woocommerce_checkout_place_order]').closest('form.checkout');
        $('input[name^=shipping]', checkoutFormElem).remove();
        hiddenShipToDifferentAddressElem.remove();
        return;
      }

      // Reset to ensure that hidden element has correct value.
      hiddenShipToDifferentAddressElem.remove();

      $('<input>').attr({
        type:  'hidden',
        value: value,
        name:  name,
      }).prependTo('form.checkout');

      forEach(shippingFormInputFieldNames, function(name) {
        const elemByName = $(`.et_pb_wc_checkout_shipping input[name=${name}]:not([type=hidden])`);
        const value      = elemByName.val();
        const hiddenElem = $(`input[type=hidden][name=${name}]`);

        // Remove existing hidden element with the same name to avoid repetition.
        hiddenElem.remove();

        $('<input>').attr({
          type:  'hidden',
          value: value,
          name:  name,
        }).prependTo('form.checkout');
      });

      forEach(shippingFormSelectFieldNames, function(name) {
        const elemType   = $(`.et_pb_wc_checkout_shipping input[name="${name}"]`).attr('type');
        const hiddenElem = $(`.et_pb_wc_checkout_payment_info input[type=hidden][name=${name}]`);

        let elemByName;
        let value;

        if ('hidden' === elemType) {
          elemByName = $(`.et_pb_wc_checkout_shipping input[name="${name}"]`);
          value      = elemByName.val();
        } else {
          elemByName = $(`.et_pb_wc_checkout_shipping select[name=${name}]:visible option:selected`);
          value      = elemByName.val();
        }

        // Remove existing hidden element with the same name to avoid repetition.
        hiddenElem.remove();

        $('<input>').attr({
          type:  'hidden',
          value: value,
          name:  name,
        }).prependTo('.et_pb_wc_checkout_payment_info form.checkout');
      });
    });

    $(document.body).on('wc_cart_emptied', hideCartTotals);

    /**
     * Execute Order received page scripts.
     *
     * `init_checkout` won't be triggered on Order received page. Hence these
     * scripts cannot be hooked on to by listening to `init_checkout` event.
     */
    removeEmptyRowPaddingInOrderReceivedPage();
  }

  init();

})(jQuery);

/**
 * Override WooCommerce's JS functions.
 *
 * The reason this block exists is to avoid $ conflict.
 */
jQuery(function($) {
  /*
   * Secondary nav bar messes up the scroll position.
   *
   * `scroll_to_notices` is overridden to solve the problem.
   */

  // Common scroll to element code.
  $.scroll_to_notices = function(scrollElement) {
    let topPosition = 100;

    if ($('.et-fixed-header').length) {
      topPosition = topPosition + $('.et-fixed-header').height();
    }

    if (scrollElement.length) {
      $('html, body').animate({
        scrollTop: (scrollElement.offset().top - topPosition)
      }, 1000);
    }
  };
});