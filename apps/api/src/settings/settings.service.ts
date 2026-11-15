import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyPosition, PaymentMethod, Prisma } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { UpdateInvoiceSettingsDto } from './dto/update-invoice-settings.dto.js';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';
import { UpdateOrderSettingsDto } from './dto/update-order-settings.dto.js';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto.js';
import { UpdateRegionalSettingsDto } from './dto/update-regional-settings.dto.js';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto.js';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto.js';
import {
  BUSINESS_PROFILE_INCLUDE,
  DEFAULT_BUSINESS_PROFILE,
  DEFAULT_INVOICE_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_ORDER_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_REGIONAL_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  DOCUMENT_SEQUENCE_INVOICE_KEY,
  INVOICE_SETTINGS_INCLUDE,
  SETTINGS_SINGLETON_ID,
  SettingsCategory,
} from './settings.constants.js';
import {
  toAllSettingsResponse,
  toBusinessProfileResponse,
  toEffectiveInvoiceBusinessInformation,
  toInvoiceSettingsResponse,
  toNotificationSettingsResponse,
  toOrderSettingsResponse,
  toPaymentSettingsResponse,
  toRegionalSettingsResponse,
  toShippingSettingsResponse,
  toTaxSettingsResponse,
} from './settings.mapper.js';
import type {
  AllSettingsResponse,
  BusinessProfileResponse,
  BusinessProfileRow,
  EffectiveInvoiceBusinessInformation,
  InvoiceSettingsResponse,
  InvoiceSettingsRow,
  NotificationSettingsResponse,
  NotificationSettingsRow,
  OrderRuntimeConfig,
  OrderSettingsResponse,
  OrderSettingsRow,
  PaymentSettingsResponse,
  PaymentSettingsRow,
  RegionalSettingsResponse,
  RegionalSettingsRow,
  SettingsCategoryResponse,
  ShippingSettingsResponse,
  ShippingSettingsRow,
  TaxSettingsResponse,
  TaxSettingsRow,
} from './settings.types.js';
import {
  areValidSeparators,
  isInvoiceNumberFormatCompatible,
  isUniqueConstraintViolation,
} from './settings.utils.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<AllSettingsResponse> {
    const [
      businessProfile,
      invoice,
      regional,
      tax,
      order,
      payment,
      shipping,
      notification,
    ] = await Promise.all([
      this.readBusinessProfileRow(),
      this.readInvoiceSettingsRow(),
      this.readRegionalSettingsRow(),
      this.readTaxSettingsRow(),
      this.readOrderSettingsRow(),
      this.readPaymentSettingsRow(),
      this.readShippingSettingsRow(),
      this.readNotificationSettingsRow(),
    ]);

    return toAllSettingsResponse({
      businessProfile,
      invoice,
      regional,
      tax,
      order,
      payment,
      shipping,
      notification,
    });
  }

  async getCategory(category: SettingsCategory): Promise<SettingsCategoryResponse> {
    switch (category) {
      case SettingsCategory.BusinessProfile:
        return this.getBusinessProfile();
      case SettingsCategory.Invoice:
        return this.getInvoiceSettings();
      case SettingsCategory.Regional:
        return this.getRegionalSettings();
      case SettingsCategory.Tax:
        return this.getTaxSettings();
      case SettingsCategory.Order:
        return this.getOrderSettings();
      case SettingsCategory.Payment:
        return this.getPaymentSettings();
      case SettingsCategory.Shipping:
        return this.getShippingSettings();
      case SettingsCategory.Notification:
        return this.getNotificationSettings();
      default: {
        const exhaustive: never = category;
        throw new BadRequestException(`Unknown settings category: ${exhaustive}`);
      }
    }
  }

  async getBusinessProfile(): Promise<BusinessProfileResponse> {
    return toBusinessProfileResponse(await this.readBusinessProfileRow());
  }

  async getInvoiceSettings(): Promise<InvoiceSettingsResponse> {
    const [businessProfile, invoice] = await Promise.all([
      this.readBusinessProfileRow(),
      this.readInvoiceSettingsRow(),
    ]);

    return toInvoiceSettingsResponse(invoice, businessProfile);
  }

  async getRegionalSettings(): Promise<RegionalSettingsResponse> {
    return toRegionalSettingsResponse(await this.readRegionalSettingsRow());
  }

  async getTaxSettings(): Promise<TaxSettingsResponse> {
    return toTaxSettingsResponse(await this.readTaxSettingsRow());
  }

  async getOrderSettings(): Promise<OrderSettingsResponse> {
    return toOrderSettingsResponse(await this.readOrderSettingsRow());
  }

  async getPaymentSettings(): Promise<PaymentSettingsResponse> {
    return toPaymentSettingsResponse(await this.readPaymentSettingsRow());
  }

  async getShippingSettings(): Promise<ShippingSettingsResponse> {
    return toShippingSettingsResponse(await this.readShippingSettingsRow());
  }

  async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    return toNotificationSettingsResponse(await this.readNotificationSettingsRow());
  }

  async getInvoiceBusinessInformation(): Promise<EffectiveInvoiceBusinessInformation> {
    const [businessProfile, invoice] = await Promise.all([
      this.readBusinessProfileRow(),
      this.readInvoiceSettingsRow(),
    ]);

    return toEffectiveInvoiceBusinessInformation(invoice, businessProfile);
  }

  async getInvoiceNumberingConfig(): Promise<{
    numberPrefix: string;
    numberFormat: string;
    yearBasedNumbering: boolean;
    automaticNumbering: boolean;
    startingSequence: number;
  }> {
    const invoice = await this.readInvoiceSettingsRow();

    return {
      numberPrefix: invoice.numberPrefix,
      numberFormat: invoice.numberFormat,
      yearBasedNumbering: invoice.yearBasedNumbering,
      automaticNumbering: invoice.automaticNumbering,
      startingSequence: invoice.startingSequence,
    };
  }

  async getOrderRuntimeConfig(): Promise<OrderRuntimeConfig> {
    const [order, shipping, regional] = await Promise.all([
      this.readOrderSettingsRow(),
      this.readShippingSettingsRow(),
      this.readRegionalSettingsRow(),
    ]);

    return {
      currency: regional.currency,
      orderNumberPrefix: order.orderNumberPrefix,
      automaticNumbering: order.automaticNumbering,
      defaultStatus: order.defaultStatus,
      defaultNotes: order.defaultNotes,
      allowEditing: order.allowEditing,
      requireCustomerInformation: order.requireCustomerInformation,
      shippingEnabled: shipping.enabled,
      defaultShippingCharge: shipping.defaultCharge,
      freeShippingThreshold: shipping.freeShippingThreshold,
    };
  }

  async isPaymentMethodEnabled(method: PaymentMethod): Promise<boolean> {
    const payment = await this.readPaymentSettingsRow();
    return payment.enabledMethods.includes(method);
  }

  async updateBusinessProfile(
    dto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponse> {
    if (dto.logoImageId !== undefined && dto.logoImageId !== null) {
      await this.ensureImageExists(dto.logoImageId);
    }

    await this.readBusinessProfileRow();

    const data: Prisma.BusinessProfileSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'businessName', dto.businessName);
    assignDefined(data, 'legalName', dto.legalName);
    assignDefined(data, 'logoImageId', dto.logoImageId);
    assignDefined(data, 'email', dto.email);
    assignDefined(data, 'phone', dto.phone);
    assignDefined(data, 'alternativePhone', dto.alternativePhone);
    assignDefined(data, 'website', dto.website);
    assignDefined(data, 'description', dto.description);
    assignDefined(data, 'registrationNumber', dto.registrationNumber);
    assignDefined(
      data,
      'taxIdentificationNumber',
      dto.taxIdentificationNumber,
    );
    assignDefined(data, 'addressLine1', dto.addressLine1);
    assignDefined(data, 'addressLine2', dto.addressLine2);
    assignDefined(data, 'city', dto.city);
    assignDefined(data, 'state', dto.state);
    assignDefined(data, 'postalCode', dto.postalCode);
    assignDefined(data, 'country', dto.country);

    try {
      const updated = await this.prisma.client.businessProfileSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
        include: BUSINESS_PROFILE_INCLUDE,
      });

      return toBusinessProfileResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateInvoiceSettings(
    dto: UpdateInvoiceSettingsDto,
  ): Promise<InvoiceSettingsResponse> {
    if (dto.logoImageId !== undefined && dto.logoImageId !== null) {
      await this.ensureImageExists(dto.logoImageId);
    }

    await this.readInvoiceSettingsRow();

    try {
      const updated = await this.prisma.client.$transaction(async (tx) => {
        const current = await tx.invoiceSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        });

        const nextYearBased = dto.yearBasedNumbering ?? current.yearBasedNumbering;
        const nextFormat = dto.numberFormat ?? current.numberFormat;

        if (!isInvoiceNumberFormatCompatible(nextFormat, nextYearBased)) {
          throw new BadRequestException(
            'numberFormat cannot contain {year} when yearBasedNumbering is disabled',
          );
        }

        if (dto.startingSequence !== undefined) {
          const maxSequence = await tx.documentSequence.aggregate({
            where: { key: DOCUMENT_SEQUENCE_INVOICE_KEY },
            _max: { nextValue: true },
          });

          if (
            maxSequence._max.nextValue !== null &&
            dto.startingSequence < maxSequence._max.nextValue
          ) {
            throw new ConflictException(
              'startingSequence cannot be lower than an already allocated invoice sequence',
            );
          }

          const year = nextYearBased ? new Date().getUTCFullYear() : 0;
          await tx.documentSequence.updateMany({
            where: {
              key: DOCUMENT_SEQUENCE_INVOICE_KEY,
              year,
              nextValue: { lt: dto.startingSequence },
            },
            data: { nextValue: dto.startingSequence },
          });
        }

        const data: Prisma.InvoiceSettingsUncheckedUpdateInput = {};

        assignDefined(data, 'useBusinessProfile', dto.useBusinessProfile);
        assignDefined(data, 'displayName', dto.displayName);
        assignDefined(data, 'logoImageId', dto.logoImageId);
        assignDefined(data, 'email', dto.email);
        assignDefined(data, 'phone', dto.phone);
        assignDefined(data, 'addressLine1', dto.addressLine1);
        assignDefined(data, 'addressLine2', dto.addressLine2);
        assignDefined(data, 'city', dto.city);
        assignDefined(data, 'state', dto.state);
        assignDefined(data, 'postalCode', dto.postalCode);
        assignDefined(data, 'country', dto.country);
        assignDefined(
          data,
          'taxRegistrationNumber',
          dto.taxRegistrationNumber,
        );
        assignDefined(data, 'additionalInfo', dto.additionalInfo);
        assignDefined(data, 'numberPrefix', dto.numberPrefix);
        assignDefined(data, 'numberFormat', dto.numberFormat);
        assignDefined(data, 'yearBasedNumbering', dto.yearBasedNumbering);
        assignDefined(data, 'automaticNumbering', dto.automaticNumbering);
        assignDefined(data, 'startingSequence', dto.startingSequence);
        assignDefined(data, 'duePeriodDays', dto.duePeriodDays);
        assignDefined(data, 'paymentTerms', dto.paymentTerms);
        assignDefined(data, 'notes', dto.notes);
        assignDefined(data, 'footerText', dto.footerText);
        assignDefined(
          data,
          'currencyDisplayFormat',
          dto.currencyDisplayFormat,
        );
        assignDefined(data, 'showSku', dto.showSku);
        assignDefined(data, 'showTaxBreakdown', dto.showTaxBreakdown);
        assignDefined(
          data,
          'showDiscountBreakdown',
          dto.showDiscountBreakdown,
        );
        assignDefined(data, 'defaultStatus', dto.defaultStatus);
        assignDefined(
          data,
          'allowEditingAfterIssue',
          dto.allowEditingAfterIssue,
        );
        assignDefined(data, 'allowCancellation', dto.allowCancellation);

        return tx.invoiceSettings.update({
          where: { id: SETTINGS_SINGLETON_ID },
          data,
          include: INVOICE_SETTINGS_INCLUDE,
        });
      });

      return toInvoiceSettingsResponse(updated, await this.readBusinessProfileRow());
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateRegionalSettings(
    dto: UpdateRegionalSettingsDto,
  ): Promise<RegionalSettingsResponse> {
    const current = await this.readRegionalSettingsRow();

    const nextDecimalSeparator =
      dto.decimalSeparator === undefined
        ? current.decimalSeparator
        : (dto.decimalSeparator ?? '');
    const nextThousandSeparator =
      dto.thousandSeparator === undefined
        ? current.thousandSeparator
        : (dto.thousandSeparator ?? '');
    const nextPrecision = dto.decimalPrecision ?? current.decimalPrecision;

    if (
      !areValidSeparators(nextDecimalSeparator, nextThousandSeparator) ||
      (nextPrecision > 0 && nextDecimalSeparator === '')
    ) {
      throw new BadRequestException(
        'decimalSeparator and thousandSeparator must differ and cannot be digits or letters',
      );
    }

    const data: Prisma.RegionalSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'currency', dto.currency);
    assignDefined(data, 'currencySymbol', dto.currencySymbol);
    assignDefined(data, 'currencyPosition', dto.currencyPosition);
    assignDefined(data, 'decimalPrecision', dto.decimalPrecision);

    if (dto.thousandSeparator !== undefined) {
      data.thousandSeparator = dto.thousandSeparator ?? '';
    }

    if (dto.decimalSeparator !== undefined) {
      data.decimalSeparator = dto.decimalSeparator ?? '';
    }

    assignDefined(data, 'defaultCountry', dto.defaultCountry);
    assignDefined(data, 'timezone', dto.timezone);
    assignDefined(data, 'dateFormat', dto.dateFormat);
    assignDefined(data, 'timeFormat', dto.timeFormat);
    assignDefined(data, 'language', dto.language);

    try {
      const updated = await this.prisma.client.regionalSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toRegionalSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateTaxSettings(
    dto: UpdateTaxSettingsDto,
  ): Promise<TaxSettingsResponse> {
    await this.readTaxSettingsRow();

    const data: Prisma.TaxSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'enabled', dto.enabled);
    assignDefined(data, 'defaultName', dto.defaultName);
    assignDefined(
      data,
      'defaultRate',
      dto.defaultRate === undefined ? undefined : new Prisma.Decimal(dto.defaultRate),
    );
    assignDefined(
      data,
      'taxIdentificationNumber',
      dto.taxIdentificationNumber,
    );
    assignDefined(data, 'pricingMode', dto.pricingMode);
    assignDefined(data, 'showBreakdownOnInvoice', dto.showBreakdownOnInvoice);

    try {
      const updated = await this.prisma.client.taxSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toTaxSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateOrderSettings(
    dto: UpdateOrderSettingsDto,
  ): Promise<OrderSettingsResponse> {
    await this.readOrderSettingsRow();

    const data: Prisma.OrderSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'orderNumberPrefix', dto.orderNumberPrefix);
    assignDefined(data, 'automaticNumbering', dto.automaticNumbering);
    assignDefined(data, 'defaultStatus', dto.defaultStatus);
    assignDefined(data, 'defaultNotes', dto.defaultNotes);
    assignDefined(data, 'allowEditing', dto.allowEditing);
    assignDefined(
      data,
      'requireCustomerInformation',
      dto.requireCustomerInformation,
    );

    try {
      const updated = await this.prisma.client.orderSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toOrderSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updatePaymentSettings(
    dto: UpdatePaymentSettingsDto,
  ): Promise<PaymentSettingsResponse> {
    const current = await this.readPaymentSettingsRow();

    const nextMethods = dto.enabledMethods ?? current.enabledMethods;
    const nextDefault = dto.defaultMethod ?? current.defaultMethod;

    if (!nextMethods.includes(nextDefault)) {
      throw new BadRequestException(
        'defaultMethod must be included in enabledMethods',
      );
    }

    const data: Prisma.PaymentSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'enabledMethods', dto.enabledMethods);
    assignDefined(data, 'defaultMethod', dto.defaultMethod);
    assignDefined(data, 'bankAccountName', dto.bankAccountName);
    assignDefined(data, 'bankName', dto.bankName);
    assignDefined(data, 'accountNumber', dto.accountNumber);
    assignDefined(data, 'branchName', dto.branchName);
    assignDefined(data, 'routingNumber', dto.routingNumber);
    assignDefined(data, 'paymentInstructions', dto.paymentInstructions);
    assignDefined(data, 'defaultPaymentTerms', dto.defaultPaymentTerms);

    try {
      const updated = await this.prisma.client.paymentSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toPaymentSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateShippingSettings(
    dto: UpdateShippingSettingsDto,
  ): Promise<ShippingSettingsResponse> {
    await this.readShippingSettingsRow();

    const data: Prisma.ShippingSettingsUncheckedUpdateInput = {};

    assignDefined(data, 'enabled', dto.enabled);
    assignDefined(
      data,
      'defaultCharge',
      dto.defaultCharge === undefined
        ? undefined
        : new Prisma.Decimal(dto.defaultCharge),
    );
    assignDefined(
      data,
      'freeShippingThreshold',
      dto.freeShippingThreshold === undefined
        ? undefined
        : dto.freeShippingThreshold === null
          ? null
          : new Prisma.Decimal(dto.freeShippingThreshold),
    );
    assignDefined(data, 'deliveryInstructions', dto.deliveryInstructions);
    assignDefined(data, 'defaultDeliveryMethod', dto.defaultDeliveryMethod);

    try {
      const updated = await this.prisma.client.shippingSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toShippingSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async updateNotificationSettings(
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingsResponse> {
    await this.readNotificationSettingsRow();

    const data: Prisma.NotificationSettingsUncheckedUpdateInput = {};

    assignDefined(
      data,
      'businessNotificationEmail',
      dto.businessNotificationEmail,
    );
    assignDefined(
      data,
      'orderConfirmationEnabled',
      dto.orderConfirmationEnabled,
    );
    assignDefined(data, 'paymentEnabled', dto.paymentEnabled);
    assignDefined(data, 'invoiceEnabled', dto.invoiceEnabled);
    assignDefined(data, 'senderName', dto.senderName);
    assignDefined(data, 'replyToEmail', dto.replyToEmail);

    try {
      const updated = await this.prisma.client.notificationSettings.update({
        where: { id: SETTINGS_SINGLETON_ID },
        data,
      });

      return toNotificationSettingsResponse(updated);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async resetCategory(category: SettingsCategory): Promise<SettingsCategoryResponse> {
    switch (category) {
      case SettingsCategory.BusinessProfile:
        return this.resetBusinessProfile();
      case SettingsCategory.Invoice:
        return this.resetInvoiceSettings();
      case SettingsCategory.Regional:
        return this.resetRegionalSettings();
      case SettingsCategory.Tax:
        return this.resetTaxSettings();
      case SettingsCategory.Order:
        return this.resetOrderSettings();
      case SettingsCategory.Payment:
        return this.resetPaymentSettings();
      case SettingsCategory.Shipping:
        return this.resetShippingSettings();
      case SettingsCategory.Notification:
        return this.resetNotificationSettings();
      default: {
        const exhaustive: never = category;
        throw new BadRequestException(`Unknown settings category: ${exhaustive}`);
      }
    }
  }

  async resetBusinessProfile(): Promise<BusinessProfileResponse> {
    await this.readBusinessProfileRow();
    const updated = await this.prisma.client.businessProfileSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_BUSINESS_PROFILE },
      include: BUSINESS_PROFILE_INCLUDE,
    });

    return toBusinessProfileResponse(updated);
  }

  async resetInvoiceSettings(): Promise<InvoiceSettingsResponse> {
    await this.readInvoiceSettingsRow();
    const updated = await this.prisma.client.invoiceSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_INVOICE_SETTINGS },
      include: INVOICE_SETTINGS_INCLUDE,
    });

    return toInvoiceSettingsResponse(updated, await this.readBusinessProfileRow());
  }

  async resetRegionalSettings(): Promise<RegionalSettingsResponse> {
    await this.readRegionalSettingsRow();
    const updated = await this.prisma.client.regionalSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: {
        ...DEFAULT_REGIONAL_SETTINGS,
        currencyPosition: CurrencyPosition.BEFORE,
      },
    });

    return toRegionalSettingsResponse(updated);
  }

  async resetTaxSettings(): Promise<TaxSettingsResponse> {
    await this.readTaxSettingsRow();
    const updated = await this.prisma.client.taxSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_TAX_SETTINGS },
    });

    return toTaxSettingsResponse(updated);
  }

  async resetOrderSettings(): Promise<OrderSettingsResponse> {
    await this.readOrderSettingsRow();
    const updated = await this.prisma.client.orderSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_ORDER_SETTINGS },
    });

    return toOrderSettingsResponse(updated);
  }

  async resetPaymentSettings(): Promise<PaymentSettingsResponse> {
    await this.readPaymentSettingsRow();
    const updated = await this.prisma.client.paymentSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_PAYMENT_SETTINGS },
    });

    return toPaymentSettingsResponse(updated);
  }

  async resetShippingSettings(): Promise<ShippingSettingsResponse> {
    await this.readShippingSettingsRow();
    const updated = await this.prisma.client.shippingSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_SHIPPING_SETTINGS },
    });

    return toShippingSettingsResponse(updated);
  }

  async resetNotificationSettings(): Promise<NotificationSettingsResponse> {
    await this.readNotificationSettingsRow();
    const updated = await this.prisma.client.notificationSettings.update({
      where: { id: SETTINGS_SINGLETON_ID },
      data: { ...DEFAULT_NOTIFICATION_SETTINGS },
    });

    return toNotificationSettingsResponse(updated);
  }

  private async readBusinessProfileRow(): Promise<BusinessProfileRow> {
    const existing = await this.prisma.client.businessProfileSettings.findUnique({
      where: { id: SETTINGS_SINGLETON_ID },
      include: BUSINESS_PROFILE_INCLUDE,
    });

    if (existing) {
      return existing;
    }

    return this.createSingleton(
      () =>
        this.prisma.client.businessProfileSettings.create({
          data: {
            id: SETTINGS_SINGLETON_ID,
            ...DEFAULT_BUSINESS_PROFILE,
          },
          include: BUSINESS_PROFILE_INCLUDE,
        }),
      () =>
        this.prisma.client.businessProfileSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
          include: BUSINESS_PROFILE_INCLUDE,
        }),
    );
  }

  private async readInvoiceSettingsRow(): Promise<InvoiceSettingsRow> {
    const existing = await this.prisma.client.invoiceSettings.findUnique({
      where: { id: SETTINGS_SINGLETON_ID },
      include: INVOICE_SETTINGS_INCLUDE,
    });

    if (existing) {
      return existing;
    }

    return this.createSingleton(
      () =>
        this.prisma.client.invoiceSettings.create({
          data: {
            id: SETTINGS_SINGLETON_ID,
            ...DEFAULT_INVOICE_SETTINGS,
          },
          include: INVOICE_SETTINGS_INCLUDE,
        }),
      () =>
        this.prisma.client.invoiceSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
          include: INVOICE_SETTINGS_INCLUDE,
        }),
    );
  }

  private async readRegionalSettingsRow(): Promise<RegionalSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.regionalSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.regionalSettings.create({
          data: {
            id: SETTINGS_SINGLETON_ID,
            ...DEFAULT_REGIONAL_SETTINGS,
          },
        }),
      () =>
        this.prisma.client.regionalSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async readTaxSettingsRow(): Promise<TaxSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.taxSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.taxSettings.create({
          data: { id: SETTINGS_SINGLETON_ID, ...DEFAULT_TAX_SETTINGS },
        }),
      () =>
        this.prisma.client.taxSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async readOrderSettingsRow(): Promise<OrderSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.orderSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.orderSettings.create({
          data: { id: SETTINGS_SINGLETON_ID, ...DEFAULT_ORDER_SETTINGS },
        }),
      () =>
        this.prisma.client.orderSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async readPaymentSettingsRow(): Promise<PaymentSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.paymentSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.paymentSettings.create({
          data: { id: SETTINGS_SINGLETON_ID, ...DEFAULT_PAYMENT_SETTINGS },
        }),
      () =>
        this.prisma.client.paymentSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async readShippingSettingsRow(): Promise<ShippingSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.shippingSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.shippingSettings.create({
          data: { id: SETTINGS_SINGLETON_ID, ...DEFAULT_SHIPPING_SETTINGS },
        }),
      () =>
        this.prisma.client.shippingSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async readNotificationSettingsRow(): Promise<NotificationSettingsRow> {
    return this.readSimpleSingleton(
      () =>
        this.prisma.client.notificationSettings.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
      () =>
        this.prisma.client.notificationSettings.create({
          data: {
            id: SETTINGS_SINGLETON_ID,
            ...DEFAULT_NOTIFICATION_SETTINGS,
          },
        }),
      () =>
        this.prisma.client.notificationSettings.findUniqueOrThrow({
          where: { id: SETTINGS_SINGLETON_ID },
        }),
    );
  }

  private async createSingleton<T>(
    create: () => Promise<T>,
    read: () => Promise<T>,
  ): Promise<T> {
    try {
      return await create();
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return read();
      }

      throw error;
    }
  }

  private async readSimpleSingleton<T>(
    readExisting: () => Promise<T | null>,
    create: () => Promise<T>,
    readAgain: () => Promise<T>,
  ): Promise<T> {
    const existing = await readExisting();

    if (existing) {
      return existing;
    }

    return this.createSingleton(create, readAgain);
  }

  private async ensureImageExists(imageId: string): Promise<void> {
    const image = await this.prisma.client.image.findUnique({
      where: { id: imageId },
      select: { id: true },
    });

    if (!image) {
      throw new NotFoundException('Logo image not found');
    }
  }

  private mapWriteError(error: unknown): unknown {
    if (error instanceof BadRequestException || error instanceof ConflictException) {
      return error;
    }

    if (isUniqueConstraintViolation(error)) {
      return new ConflictException(
        'That image is already used by another settings category',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2014')
    ) {
      return new BadRequestException('A referenced record does not exist');
    }

    return error;
  }
}

function assignDefined<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}
