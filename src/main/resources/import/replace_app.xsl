<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>

  <xsl:param name="applicationId"/>
  <xsl:param name="projectName"/>
  <xsl:param name="keepPublishFirst" select="'true'"/>

  <!-- Values the bundled /import data was exported with -->
  <xsl:variable name="applicationIdPlaceholder" select="'com.enonic.app.xphoot'"/>
  <xsl:variable name="projectNamePlaceholder" select="'xphoot'"/>

  <xsl:variable name="applicationIdDashed" select="translate($applicationId, '.', '-')"/>
  <xsl:variable name="applicationIdPlaceholderDashed" select="translate($applicationIdPlaceholder, '.', '-')"/>

  <!-- app key inside descriptor-style string values: "<app>:descriptor" -->
  <xsl:template match="string[starts-with(text(), concat($applicationIdPlaceholder, ':'))]">
    <string>
      <xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute>
      <xsl:value-of select="concat($applicationId, substring-after(., $applicationIdPlaceholder))"/>
    </string>
  </xsl:template>

  <!-- bare app key string value -->
  <xsl:template match="string[text() = $applicationIdPlaceholder]">
    <string>
      <xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute>
      <xsl:value-of select="$applicationId"/>
    </string>
  </xsl:template>

  <!-- dashed app key in property-set names (x.<dashed-app>...) -->
  <xsl:template match="property-set/@name[. = $applicationIdPlaceholderDashed]">
    <xsl:attribute name="name"><xsl:value-of select="$applicationIdDashed"/></xsl:attribute>
  </xsl:template>

  <!-- project-role principals: role:cms.project.<placeholder>.<suffix> -->
  <xsl:template match="principal/@key[starts-with(., concat('role:cms.project.', $projectNamePlaceholder, '.'))]">
    <xsl:attribute name="key">
      <xsl:value-of select="concat('role:cms.project.', $projectName, '.', substring-after(., concat('role:cms.project.', $projectNamePlaceholder, '.')))"/>
    </xsl:attribute>
  </xsl:template>

  <xsl:template match="@*|node()">
    <xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy>
  </xsl:template>

  <!-- Remove publishing metadata on import -->
  <xsl:template match="data/property-set[@name='publish']">
    <xsl:if test="$keepPublishFirst != 'false'">
      <xsl:copy><xsl:apply-templates select="@*|*[@name='first']"/></xsl:copy>
    </xsl:if>
  </xsl:template>
</xsl:stylesheet>
